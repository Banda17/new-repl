import type { Express } from "express";
import { createServer, type Server } from "http";
import { db } from "@db";
import { detentions, interchangeData } from "@db/schema";
import PDFDocument from "pdfkit";
import { format as formatDate, parse } from "date-fns"; //Import parse function
import { eq, and, gte, lte, desc } from "drizzle-orm";
import { setupAuth } from "./auth";
import { createSheetDataTransformer } from "./services/sheets";
import bodyParser from "body-parser";
import multer from "multer";
import { read, utils } from "xlsx";
import { initializeAccessSync, syncAccessData } from './services/accessSync';
import { sql } from 'drizzle-orm';
import { railwayLoadingOperations, users } from '@db/schema'; // Import the new schema

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

function generateDailySummary(doc: typeof PDFDocument, data: any[]) {
  try {
    doc.fontSize(20).text("Daily Operations Summary", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${formatDate(new Date(), "PPP")}`, { align: "right" });
    doc.moveDown();

    // Summary statistics
    const totalDetentions = data.length;
    const avgDetentionTime = data.reduce((acc, curr) => {
      const duration = new Date(curr.departureTime).getTime() - new Date(curr.arrivalTime).getTime();
      return acc + duration;
    }, 0) / Math.max(1, totalDetentions);

    doc.fontSize(14).text("Summary Statistics", { underline: true });
    doc.fontSize(12)
      .text(`Total Operations: ${totalDetentions}`)
      .text(`Average Detention Time: ${Math.round(avgDetentionTime / (1000 * 60))} minutes`);
    doc.moveDown();

    // Wagon Type Distribution
    const wagonTypes = data.reduce((acc: any, curr) => {
      acc[curr.wagonType] = (acc[curr.wagonType] || 0) + 1;
      return acc;
    }, {});

    Object.entries(wagonTypes).forEach(([type, count]) => {
      doc.fontSize(12).text(`${type}: ${count} operations`);
    });
  } catch (error) {
    console.error("Error in generateDailySummary:", error);
    throw error;
  }
}

function generateEfficiencyReport(doc: typeof PDFDocument, data: any[]) {
  console.log("Starting efficiency report generation");
  try {
    doc.fontSize(20).text("Efficiency Metrics Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${formatDate(new Date(), "PPP")}`, { align: "right" });
    doc.moveDown();

    // Calculate efficiency metrics
    const metrics = data.reduce((acc: any, curr) => {
      try {
        const arPlTime = new Date(curr.placementTime).getTime() - new Date(curr.arrivalTime).getTime();
        const plRlTime = new Date(curr.releaseTime).getTime() - new Date(curr.placementTime).getTime();
        const rlDpTime = new Date(curr.departureTime).getTime() - new Date(curr.releaseTime).getTime();

        acc.arPl += arPlTime;
        acc.plRl += plRlTime;
        acc.rlDp += rlDpTime;
        acc.count++;
      } catch (err) {
        console.warn("Skipping invalid entry in efficiency calculation:", err);
      }
      return acc;
    }, { arPl: 0, plRl: 0, rlDp: 0, count: 0 });

    doc.fontSize(14).text("Average Processing Times", { underline: true });
    doc.fontSize(12)
      .text(`Arrival to Placement: ${Math.round(metrics.arPl / Math.max(1, metrics.count) / (1000 * 60))} minutes`)
      .text(`Placement to Release: ${Math.round(metrics.plRl / Math.max(1, metrics.count) / (1000 * 60))} minutes`)
      .text(`Release to Departure: ${Math.round(metrics.rlDp / Math.max(1, metrics.count) / (1000 * 60))} minutes`);

    console.log("Efficiency report generation completed");
  } catch (error) {
    console.error("Error in generateEfficiencyReport:", error);
    throw error;
  }
}

function generateWagonReport(doc: typeof PDFDocument, data: any[]) {
  console.log("Starting wagon report generation");
  try {
    doc.fontSize(20).text("Wagon Utilization Report", { align: "center" });
    doc.moveDown();
    doc.fontSize(12).text(`Generated on: ${formatDate(new Date(), "PPP")}`, { align: "right" });
    doc.moveDown();

    // Group data by wagon type
    const wagonData = data.reduce((acc: any, curr) => {
      try {
        if (!acc[curr.wagonType]) {
          acc[curr.wagonType] = {
            count: 0,
            totalTime: 0,
            operations: [],
          };
        }

        const totalTime = new Date(curr.departureTime).getTime() - new Date(curr.arrivalTime).getTime();
        acc[curr.wagonType].count++;
        acc[curr.wagonType].totalTime += totalTime;
        acc[curr.wagonType].operations.push({
          rakeId: curr.rakeId,
          time: totalTime,
        });
      } catch (err) {
        console.warn("Skipping invalid entry in wagon calculation:", err);
      }
      return acc;
    }, {});

    Object.entries(wagonData).forEach(([type, data]: [string, any]) => {
      doc.fontSize(14).text(`${type} Wagons`, { underline: true });
      doc.fontSize(12)
        .text(`Total Operations: ${data.count}`)
        .text(`Average Processing Time: ${Math.round(data.totalTime / Math.max(1, data.count) / (1000 * 60))} minutes`);
      doc.moveDown();
    });

    console.log("Wagon report generation completed");
  } catch (error) {
    console.error("Error in generateWagonReport:", error);
    throw error;
  }
}

function generateComparativeLoadingPDF(doc: typeof PDFDocument, data: any) {
  try {
    // Clean header design
    doc.rect(0, 0, 842, 100).fill('#1e3a8a');
    
    // Indian Railway Logo - positioned on the left
    try {
      doc.image('./attached_assets/Indian_Railway_Logo_2_1750768462355.png', 40, 20, { width: 60, height: 60 });
    } catch (error) {
      // Fallback if logo image is not available
      doc.rect(40, 20, 60, 60).fill('#dc2626').stroke('#ffffff').lineWidth(2);
      doc.fillColor('#ffffff').fontSize(12).font('Helvetica-Bold').text('IR', 60, 45, { align: 'center', width: 20 });
    }
    
    // Main title - centered with proper spacing
    doc.fillColor('white').fontSize(24).font('Helvetica-Bold')
       .text("COMPARATIVE LOADING ANALYSIS", 120, 20, { align: "center", width: 600 });
    
    doc.fontSize(14).font('Helvetica')
       .text("OPERATIONAL PERFORMANCE REPORT", 120, 45, { align: "center", width: 600 });
    
    // Period information on separate lines for clarity
    doc.fontSize(11).font('Helvetica-Bold')
       .text(`Period: ${data.periods.current}`, 120, 70, { align: "center", width: 600 });
    doc.fontSize(10).font('Helvetica')
       .text(`vs ${data.periods.previous}`, 120, 85, { align: "center", width: 600 });
    
    // Generation info - top right
    const now = new Date();
    doc.fontSize(9).font('Helvetica')
       .text(`Generated: ${now.toLocaleDateString('en-IN')} ${now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`, 720, 15);
    
    doc.fillColor('black');
    let yPosition = 130;

    // Properly sized table with better proportions
    const columnWidths = [95, 50, 55, 55, 55, 70, 50, 55, 55, 55, 70, 70];
    const tableWidth = columnWidths.reduce((sum, width) => sum + width, 0);
    const startX = (842 - tableWidth) / 2; // Center the table
    
    // Main header row
    doc.rect(startX, yPosition, tableWidth, 25).fill('#1e40af');
    doc.fillColor('white').fontSize(12).font('Helvetica-Bold');
    
    // Properly aligned merged headers
    doc.text('Commodity', startX + 5, yPosition + 8, { width: 85, align: 'center' });
    doc.text('CURRENT PERIOD', startX + 95, yPosition + 8, { width: 285, align: 'center' });
    doc.text('PREVIOUS PERIOD', startX + 380, yPosition + 8, { width: 285, align: 'center' });
    doc.text('Performance', startX + 665, yPosition + 8, { width: 70, align: 'center' });
    
    // Clean dividing lines
    doc.strokeColor('#ffffff').lineWidth(1.5);
    doc.moveTo(startX + 95, yPosition).lineTo(startX + 95, yPosition + 25).stroke();
    doc.moveTo(startX + 380, yPosition).lineTo(startX + 380, yPosition + 25).stroke();
    doc.moveTo(startX + 665, yPosition).lineTo(startX + 665, yPosition + 25).stroke();
    
    yPosition += 25;
    
    // Sub-header row with proper alignment
    doc.rect(startX, yPosition, tableWidth, 20).fill('#3b82f6');
    doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
    
    const subHeaders = ['', 'RKs', 'Avg/Day', 'Wagons', 'Million MT', 'Freight', 'RKs', 'Avg/Day', 'Wagons', 'Million MT', 'Freight', 'Change %'];
    let xPosition = startX;
    
    subHeaders.forEach((header, index) => {
      if (header) {
        doc.text(header, xPosition + 5, yPosition + 6, { 
          width: columnWidths[index] - 10, 
          align: 'center' 
        });
      }
      xPosition += columnWidths[index];
    });
    
    yPosition += 20;
    doc.fillColor('black').fontSize(9).font('Helvetica');

    data.data.forEach((row: any, rowIndex: number) => {
      if (yPosition > 720) {
        doc.addPage();
        yPosition = 50;
        
        // Redraw header on new page
        doc.rect(startX, yPosition, tableWidth, 25).fill('#1e40af');
        doc.fillColor('white').fontSize(12).font('Helvetica-Bold');
        
        doc.text('Commodity', startX + 5, yPosition + 8, { width: 85, align: 'center' });
        doc.text('CURRENT PERIOD', startX + 95, yPosition + 8, { width: 285, align: 'center' });
        doc.text('PREVIOUS PERIOD', startX + 380, yPosition + 8, { width: 285, align: 'center' });
        doc.text('Performance', startX + 665, yPosition + 8, { width: 70, align: 'center' });
        
        yPosition += 25;
        
        // Sub-header row
        doc.rect(startX, yPosition, tableWidth, 20).fill('#3b82f6');
        doc.fillColor('white').fontSize(9).font('Helvetica-Bold');
        
        let headerX = startX;
        subHeaders.forEach((header, index) => {
          if (header) {
            doc.text(header, headerX + 5, yPosition + 6, { 
              width: columnWidths[index] - 10, 
              align: 'center' 
            });
          }
          headerX += columnWidths[index];
        });
        yPosition += 20;
        doc.fillColor('black').fontSize(9).font('Helvetica');
      }

      // Clean alternating row design
      const rowColor = rowIndex % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(startX, yPosition, tableWidth, 20).fill(rowColor);
      
      // Subtle row borders
      doc.strokeColor('#e2e8f0').lineWidth(0.3);
      doc.rect(startX, yPosition, tableWidth, 20).stroke();
      
      // Enhanced data formatting with proper alignment
      const values = [
        row.commodity || 'N/A',
        row.currentPeriod.rks?.toString() || '0',
        row.currentPeriod.avgPerDay?.toFixed(1) || '0.0',
        row.currentPeriod.wagons?.toString() || '0',
        (row.currentPeriod.tonnage / 1000000)?.toFixed(3) || '0.000',
        `₹${(row.currentPeriod.freight / 10000000)?.toFixed(1)}Cr`,
        row.previousPeriod.rks?.toString() || '0',
        row.previousPeriod.avgPerDay?.toFixed(1) || '0.0',
        row.previousPeriod.wagons?.toString() || '0',
        (row.previousPeriod.tonnage / 1000000)?.toFixed(3) || '0.000',
        `₹${(row.previousPeriod.freight / 10000000)?.toFixed(1)}Cr`,
        `${row.changeInPercentage > 0 ? '+' : ''}${row.changeInPercentage?.toFixed(1)}%`
      ];

      // Color coding for performance column
      const changeValue = row.changeInPercentage || 0;
      
      xPosition = startX;
      values.forEach((value, index) => {
        if (index === 0) {
          // Commodity name - left aligned and bold
          doc.fillColor('#1f2937').font('Helvetica-Bold').fontSize(9);
          doc.text(value, xPosition + 8, yPosition + 6, { 
            width: columnWidths[index] - 16, 
            align: 'left'
          });
        } else if (index === 11) {
          // Change percentage with color coding
          const changeColor = changeValue > 0 ? '#059669' : changeValue < 0 ? '#dc2626' : '#64748b';
          doc.fillColor(changeColor).font('Helvetica-Bold').fontSize(9);
          doc.text(value, xPosition + 5, yPosition + 6, { 
            width: columnWidths[index] - 10, 
            align: 'center'
          });
        } else {
          // Regular data - center aligned
          doc.fillColor('#374151').font('Helvetica').fontSize(9);
          doc.text(value, xPosition + 5, yPosition + 6, { 
            width: columnWidths[index] - 10, 
            align: 'center'
          });
        }
        xPosition += columnWidths[index];
      });
      
      yPosition += 20;
    });

    // Clean Summary section
    yPosition += 30;
    if (yPosition > 580) {
      doc.addPage();
      yPosition = 50;
    }

    const summaryWidth = 700;
    const summaryX = (842 - summaryWidth) / 2;

    // Summary header
    doc.rect(summaryX, yPosition, summaryWidth, 30).fill('#1e40af');
    doc.fillColor('white').fontSize(18).font('Helvetica-Bold')
       .text("PERFORMANCE SUMMARY", summaryX, yPosition + 8, { align: 'center', width: summaryWidth });
    
    yPosition += 35;
    
    const totalCurrent = data.totals?.currentPeriod?.tonnage || 0;
    const totalPrevious = data.totals?.previousPeriod?.tonnage || 0;
    const totalChange = totalPrevious > 0 ? ((totalCurrent - totalPrevious) / totalPrevious * 100) : 0;
    
    // Summary content with better layout
    doc.rect(summaryX, yPosition, summaryWidth, 80).fill('#f8fafc').stroke('#cbd5e1');
    
    // Left side - Current period
    doc.fillColor('#1f2937').fontSize(14).font('Helvetica-Bold')
       .text("Current Period Total:", summaryX + 30, yPosition + 20);
    doc.fillColor('#059669').fontSize(16).font('Helvetica-Bold')
       .text(`${(totalCurrent / 1000000).toFixed(3)} Million MT`, summaryX + 30, yPosition + 40);
    
    // Middle - Previous period
    doc.fillColor('#1f2937').fontSize(14).font('Helvetica-Bold')
       .text("Previous Period Total:", summaryX + 250, yPosition + 20);
    doc.fillColor('#6b7280').fontSize(16).font('Helvetica')
       .text(`${(totalPrevious / 1000000).toFixed(3)} Million MT`, summaryX + 250, yPosition + 40);
    
    // Right side - Performance change
    const changeColor = totalChange > 0 ? '#059669' : totalChange < 0 ? '#dc2626' : '#6b7280';
    const changeText = totalChange > 0 ? 'IMPROVEMENT' : totalChange < 0 ? 'DECLINE' : 'NO CHANGE';
    
    doc.fillColor('#1f2937').fontSize(14).font('Helvetica-Bold')
       .text("Overall Performance:", summaryX + 470, yPosition + 20);
    doc.fillColor(changeColor).fontSize(18).font('Helvetica-Bold')
       .text(`${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}%`, summaryX + 470, yPosition + 40);
    doc.fillColor(changeColor).fontSize(11).font('Helvetica-Bold')
       .text(changeText, summaryX + 470, yPosition + 60);

    // Key insights section
    yPosition += 100;
    doc.rect(summaryX, yPosition, summaryWidth, 70).fill('#eff6ff').stroke('#3b82f6');
    doc.fillColor('#1e40af').fontSize(14).font('Helvetica-Bold')
       .text("KEY INSIGHTS", summaryX + 20, yPosition + 15);
    
    doc.fillColor('#374151').fontSize(11).font('Helvetica');
    const insights = [
      `• Total ${data.data.length} commodities analyzed in this comparative study`,
      `• Freight revenue comparison shows ${totalChange > 0 ? 'positive growth' : totalChange < 0 ? 'decline' : 'stable performance'}`,
      `• Performance metrics calculated based on operational data from SCR Division`
    ];
    
    insights.forEach((insight, index) => {
      doc.text(insight, summaryX + 30, yPosition + 35 + (index * 15));
    });

    // Professional footer
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY, 842, 40).fill('#1e3a8a');
    // Add small logo in footer too
    try {
      doc.image('./attached_assets/Indian_Railway_Logo_2_1750768462355.png', 40, footerY + 5, { width: 30, height: 30 });
    } catch (error) {
      // Fallback for footer logo
    }
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold')
       .text('South Central Railway - Operations Management System', 80, footerY + 10);
    doc.fontSize(9).font('Helvetica')
       .text('Confidential Report | For Internal Use Only', 40, footerY + 25)
       .text(`Generated: ${new Date().toLocaleDateString('en-IN')} | Page 1 of 1`, 650, footerY + 25);

    console.log("Comparative loading PDF generation completed");
  } catch (error) {
    console.error("Error in generateComparativeLoadingPDF:", error);
    throw error;
  }
}

function generateYearlyComparisonPDF(doc: typeof PDFDocument, commodityData: any[], stationData: any[]) {
  try {
    // Header with Indian Railway branding
    doc.rect(0, 0, 612, 80).fill('#1e3a8a');
    
    // Add Indian Railway logo
    try {
      doc.image('./attached_assets/Indian_Railway_Logo_2_1750768462355.png', 30, 15, { width: 50, height: 50 });
    } catch (error) {
      // Fallback if logo not available
      doc.rect(30, 15, 50, 50).fill('#dc2626').stroke('#ffffff').lineWidth(2);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('IR', 50, 35, { align: 'center', width: 10 });
    }
    
    doc.fillColor('white').fontSize(22).font('Helvetica-Bold')
       .text("YEARLY COMPARISON REPORT", 100, 20, { align: "center", width: 400 });
    doc.fontSize(12).text(`Generated: ${new Date().toLocaleDateString('en-IN')}`, 420, 55);
    
    doc.fillColor('black');
    let yPosition = 100;

    // Commodity Summary Section
    doc.rect(30, yPosition, 550, 30).fill('#10b981');
    doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
       .text("Commodity-wise Loading Summary", 40, yPosition + 8);
    
    yPosition += 40;
    
    const commodityHeaders = ['Commodity', 'Total Wagons', 'Total Tonnage (MT)', 'Total Freight (₹ Cr)'];
    const colWidths = [140, 120, 140, 140];
    let xPosition = 30;
    
    // Commodity table header
    doc.rect(25, yPosition - 5, 565, 22).fill('#34d399');
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold');
    
    commodityHeaders.forEach((header, index) => {
      doc.text(header, xPosition + 5, yPosition + 3, { 
        width: colWidths[index] - 10, 
        align: 'center' 
      });
      xPosition += colWidths[index];
    });
    
    yPosition += 22;
    doc.fillColor('black').fontSize(10).font('Helvetica');

    commodityData.forEach((item: any, itemIndex: number) => {
      if (yPosition > 700) {
        doc.addPage();
        yPosition = 50;
      }

      // Alternating row colors for commodities
      const rowColor = itemIndex % 2 === 0 ? '#ecfdf5' : '#ffffff';
      doc.rect(25, yPosition - 2, 565, 18).fill(rowColor);

      const safeWagons = Number(item.totalWagons) || 0;
      const safeTonnage = Number(item.totalTonnage) || 0;
      const safeFreight = Number(item.totalFreight) || 0;

      const values = [
        String(item.commodity || 'N/A'),
        safeWagons.toLocaleString('en-IN'),
        (safeTonnage / 1000000).toFixed(2),
        `₹${(safeFreight / 10000000).toFixed(1)}`
      ];

      xPosition = 30;
      values.forEach((value, index) => {
        doc.fillColor('black').text(String(value), xPosition + 5, yPosition + 2, { 
          width: colWidths[index] - 10, 
          align: index === 0 ? 'left' : 'center' 
        });
        xPosition += colWidths[index];
      });
      
      yPosition += 18;
    });

    // Station Summary Section
    yPosition += 30;
    if (yPosition > 650) {
      doc.addPage();
      yPosition = 50;
    }

    doc.rect(30, yPosition, 550, 30).fill('#1e40af');
    doc.fillColor('white').fontSize(16).font('Helvetica-Bold')
       .text("Station-wise Loading Summary", 40, yPosition + 8);
    
    yPosition += 40;
    
    const stationHeaders = ['Station', 'Total Wagons', 'Total Tonnage (MT)', 'Total Freight (₹ Cr)'];
    xPosition = 30;
    
    // Station table header
    doc.rect(25, yPosition - 5, 565, 22).fill('#3b82f6');
    doc.fillColor('white').fontSize(11).font('Helvetica-Bold');
    
    stationHeaders.forEach((header, index) => {
      doc.text(header, xPosition + 5, yPosition + 3, { 
        width: colWidths[index] - 10, 
        align: 'center' 
      });
      xPosition += colWidths[index];
    });
    
    yPosition += 22;
    doc.fillColor('black').fontSize(10).font('Helvetica');

    stationData.forEach((item: any, itemIndex: number) => {
      if (yPosition > 720) {
        doc.addPage();
        yPosition = 50;
      }

      // Alternating row colors for stations
      const rowColor = itemIndex % 2 === 0 ? '#eff6ff' : '#ffffff';
      doc.rect(25, yPosition - 2, 565, 18).fill(rowColor);

      const safeWagons = Number(item.totalWagons) || 0;
      const safeTonnage = Number(item.totalTonnage) || 0;
      const safeFreight = Number(item.totalFreight) || 0;

      const values = [
        String(item.station || 'N/A'),
        safeWagons.toLocaleString('en-IN'),
        (safeTonnage / 1000000).toFixed(2),
        `₹${(safeFreight / 10000000).toFixed(1)}`
      ];

      xPosition = 30;
      values.forEach((value, index) => {
        doc.fillColor('black').text(String(value), xPosition + 5, yPosition + 2, { 
          width: colWidths[index] - 10, 
          align: index === 0 ? 'left' : 'center' 
        });
        xPosition += colWidths[index];
      });
      
      yPosition += 18;
    });

    // Summary totals section
    yPosition += 20;
    if (yPosition > 680) {
      doc.addPage();
      yPosition = 50;
    }

    const totalWagons = commodityData.reduce((sum, item) => sum + (Number(item.totalWagons) || 0), 0);
    const totalTonnage = commodityData.reduce((sum, item) => sum + (Number(item.totalTonnage) || 0), 0);
    const totalFreight = commodityData.reduce((sum, item) => sum + (Number(item.totalFreight) || 0), 0);

    doc.rect(25, yPosition, 565, 50).fill('#f8fafc').stroke('#e2e8f0');
    doc.fillColor('#1e40af').fontSize(14).font('Helvetica-Bold')
       .text("Overall Summary", 35, yPosition + 10);
    
    doc.fillColor('black').fontSize(11).font('Helvetica');
    doc.text(`Total Wagons: ${totalWagons.toLocaleString('en-IN')}`, 35, yPosition + 28);
    doc.text(`Total Tonnage: ${(totalTonnage / 1000000).toFixed(2)} Million MT`, 200, yPosition + 28);
    doc.text(`Total Freight: ₹${(totalFreight / 10000000).toFixed(1)} Cr`, 400, yPosition + 28);

    // Footer with logo
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY, 612, 40).fill('#1e3a8a');
    try {
      doc.image('./attached_assets/Indian_Railway_Logo_2_1750768462355.png', 30, footerY + 5, { width: 30, height: 30 });
    } catch (error) {
      // Fallback for footer logo
    }
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
       .text('South Central Railway - Operations Analysis Report', 70, footerY + 15);

    console.log("Yearly comparison PDF generation completed");
  } catch (error) {
    console.error("Error in generateYearlyComparisonPDF:", error);
    throw error;
  }
}

function generateStationComparativeLoadingPDF(doc: typeof PDFDocument, data: any) {
  // Header with Indian Railway branding
  doc.rect(0, 0, 842, 80).fill('#1e3a8a');
  
  // Add Indian Railway logo
  try {
    doc.image('./attached_assets/Indian_Railway_Logo_2_1750768462355.png', 30, 15, { width: 50, height: 50 });
  } catch (error) {
    // Fallback if logo not available
    doc.rect(30, 15, 50, 50).fill('#dc2626').stroke('#ffffff').lineWidth(2);
    doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('IR', 50, 35, { align: 'center', width: 10 });
  }
  
  doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
     .text("STATION WISE COMPARATIVE LOADING", 100, 25, { align: "center", width: 640 });
  doc.fontSize(12).font('Helvetica')
     .text(`Period: ${data.periods.current} vs ${data.periods.previous}`, 100, 50, { align: "center", width: 640 });
  
  doc.fillColor('black');
  
  let yPosition = 100;
  
  // Period headers
  doc.fontSize(12);
  doc.text(`${data.periods.current}`, 150, yPosition, { width: 150, align: 'center' });
  doc.text(`${data.periods.previous}`, 350, yPosition, { width: 150, align: 'center' });
  doc.text("Variation in", 650, yPosition, { width: 100, align: 'center' });
  
  yPosition += 20;
  
  // Column headers
  const headers = [
    'Station', 'Rks', 'Avg/Day', 'Wagon', 'MT', 'Freight', 
    'Rks', 'Avg/Day', 'Wagon', 'MT', 'Freight', 
    'in Units', 'in %age'
  ];
  
  const colWidths = [60, 35, 45, 45, 45, 45, 35, 45, 45, 45, 45, 50, 50];
  let xPosition = 50;
  
  doc.fontSize(10);
  headers.forEach((header, index) => {
    doc.text(header, xPosition, yPosition, { width: colWidths[index], align: 'center' });
    xPosition += colWidths[index];
  });
  
  yPosition += 15;
  
  // Draw header line
  doc.moveTo(50, yPosition).lineTo(750, yPosition).stroke();
  yPosition += 5;
  
  // Data rows
  data.data.forEach((item: any) => {
    if (yPosition > 500) {
      doc.addPage();
      yPosition = 50;
    }
    
    xPosition = 50;
    
    // Safe numeric handling
    const currentRks = Number(item.currentRks) || 0;
    const currentAvgPerDay = Number(item.currentAvgPerDay) || 0;
    const currentWagon = Number(item.currentWagon) || 0;
    const currentMT = Number(item.currentMT) || 0;
    const currentFreight = Number(item.currentFreight) || 0;
    
    const compareRks = Number(item.compareRks) || 0;
    const compareAvgPerDay = Number(item.compareAvgPerDay) || 0;
    const compareWagon = Number(item.compareWagon) || 0;
    const compareMT = Number(item.compareMT) || 0;
    const compareFreight = Number(item.compareFreight) || 0;
    
    const changeInMT = currentMT - compareMT;
    const changeInPercentage = compareMT > 0 ? ((changeInMT / compareMT) * 100) : (currentMT > 0 ? 100 : 0);
    
    const values = [
      String(item.station || 'N/A'),
      currentRks.toString(),
      currentAvgPerDay.toFixed(2),
      currentWagon.toString(),
      currentMT.toFixed(3),
      currentFreight.toFixed(2),
      compareRks.toString(),
      compareAvgPerDay.toFixed(2),
      compareWagon.toString(),
      compareMT.toFixed(3),
      compareFreight.toFixed(2),
      changeInMT.toFixed(3),
      changeInPercentage.toFixed(2)
    ];
    
    values.forEach((value, index) => {
      doc.text(String(value), xPosition, yPosition, { width: colWidths[index], align: 'center' });
      xPosition += colWidths[index];
    });
    
    yPosition += 12;
  });
  
  // Total row
  yPosition += 5;
  doc.moveTo(50, yPosition).lineTo(750, yPosition).stroke();
  yPosition += 5;
  
  xPosition = 50;
  const totals = data.totals;
  
  const totalChangeInMT = Number(totals.currentPeriod.tonnage) - Number(totals.previousPeriod.tonnage);
  const totalChangeInPercentage = Number(totals.previousPeriod.tonnage) > 0 ? 
    ((totalChangeInMT / Number(totals.previousPeriod.tonnage)) * 100) : 
    (Number(totals.currentPeriod.tonnage) > 0 ? 100 : 0);
  
  const totalValues = [
    'Total',
    Number(totals.currentPeriod.rks).toString(),
    Number(totals.currentPeriod.avgPerDay).toFixed(2),
    Number(totals.currentPeriod.wagons).toString(),
    Number(totals.currentPeriod.tonnage).toFixed(3),
    Number(totals.currentPeriod.freight).toFixed(2),
    Number(totals.previousPeriod.rks).toString(),
    Number(totals.previousPeriod.avgPerDay).toFixed(2),
    Number(totals.previousPeriod.wagons).toString(),
    Number(totals.previousPeriod.tonnage).toFixed(3),
    Number(totals.previousPeriod.freight).toFixed(2),
    totalChangeInMT.toFixed(3),
    totalChangeInPercentage.toFixed(2)
  ];
  
  doc.fontSize(10).font('Helvetica-Bold');
  totalValues.forEach((value, index) => {
    doc.text(String(value), xPosition, yPosition, { width: colWidths[index], align: 'center' });
    xPosition += colWidths[index];
  });
}

function generateAllEntriesPDF(doc: typeof PDFDocument, entries: any[]) {
  try {
    // Header with Indian Railway branding
    doc.rect(0, 0, 612, 80).fill('#1e3a8a');
    
    // Add Indian Railway logo
    try {
      doc.image('./attached_assets/Indian_Railway_Logo_2_1750768462355.png', 30, 15, { width: 50, height: 50 });
    } catch (error) {
      // Fallback if logo not available
      doc.rect(30, 15, 50, 50).fill('#dc2626').stroke('#ffffff').lineWidth(2);
      doc.fillColor('#ffffff').fontSize(10).font('Helvetica-Bold').text('IR', 50, 35, { align: 'center', width: 10 });
    }
    
    doc.fillColor('white').fontSize(20).font('Helvetica-Bold')
       .text("RAILWAY LOADING OPERATIONS", 100, 20, { align: "center", width: 400 });
    doc.fontSize(14).font('Helvetica')
       .text("All Entries Report", 100, 40, { align: "center", width: 400 });
    doc.fontSize(10).text(`Generated: ${new Date().toLocaleDateString()}`, 420, 55);
    doc.fontSize(9).text(`Total Records: ${entries.length}`, 420, 68);
    
    doc.fillColor('black');
    let yPosition = 100;

    const headers = ['Date', 'Station', 'Commodity', 'Wagons', 'Tonnage (MT)', 'Freight (₹)', 'RR No.'];
    const columnWidths = [70, 80, 100, 60, 80, 80, 70];
    let xPosition = 50;
    
    // Header row with background
    doc.rect(45, yPosition - 5, 520, 25).fill('#3b82f6');
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
    
    headers.forEach((header, index) => {
      doc.text(header, xPosition + 2, yPosition + 5, { 
        width: columnWidths[index] - 4, 
        align: 'center' 
      });
      xPosition += columnWidths[index];
    });
    
    yPosition += 25;
    doc.fillColor('black').fontSize(9).font('Helvetica');

    entries.forEach((entry: any, entryIndex) => {
      if (yPosition > 720) {
        doc.addPage();
        yPosition = 50;
        
        // Redraw header on new page
        doc.rect(45, yPosition - 5, 520, 25).fill('#3b82f6');
        doc.fillColor('white').fontSize(10).font('Helvetica-Bold');
        let headerX = 50;
        headers.forEach((header, index) => {
          doc.text(header, headerX + 2, yPosition + 5, { 
            width: columnWidths[index] - 4, 
            align: 'center' 
          });
          headerX += columnWidths[index];
        });
        yPosition += 25;
        doc.fillColor('black').fontSize(9).font('Helvetica');
      }

      // Alternating row colors
      const rowColor = entryIndex % 2 === 0 ? '#f8fafc' : '#ffffff';
      doc.rect(45, yPosition - 2, 520, 18).fill(rowColor);
      doc.fillColor('black');

      const values = [
        new Date(entry.pDate).toLocaleDateString('en-IN'),
        entry.station || 'N/A',
        entry.commodity || 'N/A',
        entry.wagons?.toString() || '0',
        (entry.tonnage / 1000).toFixed(2),
        `₹${(entry.freight / 100000).toFixed(1)}L`,
        `${entry.rrNoFrom || 0}-${entry.rrNoTo || 0}`
      ];

      xPosition = 50;
      values.forEach((value, index) => {
        doc.text(value, xPosition + 2, yPosition + 2, { 
          width: columnWidths[index] - 4, 
          align: index === 2 ? 'left' : 'center' 
        });
        xPosition += columnWidths[index];
      });
      
      yPosition += 18;
    });

    // Footer with logo
    const footerY = doc.page.height - 40;
    doc.rect(0, footerY, 612, 40).fill('#1e3a8a');
    try {
      doc.image('./attached_assets/Indian_Railway_Logo_2_1750768462355.png', 30, footerY + 5, { width: 30, height: 30 });
    } catch (error) {
      // Fallback for footer logo
    }
    doc.fillColor('white').fontSize(10).font('Helvetica-Bold')
       .text('Railway Operations Management System', 70, footerY + 15);

    console.log("All entries PDF generation completed");
  } catch (error) {
    console.error("Error in generateAllEntriesPDF:", error);
    throw error;
  }
}

export function registerRoutes(app: Express): Server {
  // Setup authentication routes and middleware
  setupAuth(app);

  // Configure body parser with increased limits for report generation
  app.use(bodyParser.json({ limit: '100mb' }));
  app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

  // put application routes here
  // prefix all routes with /api

  app.post("/api/detentions", async (req, res) => {
    try {
      const detention = await db.insert(detentions).values({
        stationId: req.body.stationId,
        rakeId: req.body.rakeId,
        rakeName: req.body.rakeName,
        wagonType: req.body.wagonType,
        arrivalTime: new Date(req.body.arrivalDateTime),
        placementTime: new Date(req.body.placementDateTime),
        releaseTime: new Date(req.body.releaseDateTime),
        departureTime: new Date(req.body.departureDateTime),
        arPlReason: req.body.arPlReason,
        plRlReason: req.body.plRlReason,
        rlDpReason: req.body.rlDpReason,
        remarks: req.body.remarks,
      }).returning();

      res.json(detention[0]);
    } catch (error) {
      console.error("Error saving detention:", error);
      res.status(500).json({ error: "Failed to save detention data" });
    }
  });

  app.get("/api/detentions", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        console.log("Unauthorized access attempt to detentions");
        return res.status(401).send("Not authenticated");
      }

      // Allow any authenticated user to access the records
      const detentionRecords = await db.query.detentions.findMany({
        orderBy: (detentions, { desc }) => [desc(detentions.createdAt)],
      });

      console.log(`Found ${detentionRecords.length} detention records for user session`);

      res.json(detentionRecords || []);
    } catch (error) {
      console.error("Error fetching detentions:", error);
      res.status(500).json({
        error: "Failed to fetch detention data",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/detentions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const [updated] = await db.update(detentions)
        .set({
          stationId: req.body.stationId,
          rakeId: req.body.rakeId,
          rakeName: req.body.rakeName,
          wagonType: req.body.wagonType,
          arrivalTime: new Date(req.body.arrivalDateTime),
          placementTime: new Date(req.body.placementDateTime),
          releaseTime: new Date(req.body.releaseDateTime),
          departureTime: new Date(req.body.departureDateTime),
          arPlReason: req.body.arPlReason,
          plRlReason: req.body.plRlReason,
          rlDpReason: req.body.rlDpReason,
          remarks: req.body.remarks,
        })
        .where(eq(detentions.id, parseInt(id)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Detention record not found" });
      }

      res.json(updated);
    } catch (error) {
      console.error("Error updating detention:", error);
      res.status(500).json({ error: "Failed to update detention data" });
    }
  });

  app.post("/api/external/detentions", async (req, res) => {
    try {
      // Check if the request has data
      if (!req.body || !Array.isArray(req.body)) {
        return res.status(400).json({
          error: "Invalid request format. Expected an array of detention records."
        });
      }

      const records = req.body;
      const insertedRecords = [];

      for (const record of records) {
        try {
          // Validate required fields
          const requiredFields = [
            'stationId', 'rakeId', 'rakeName', 'wagonType',
            'arrivalTime', 'placementTime', 'releaseTime', 'departureTime'
          ];

          const missingFields = requiredFields.filter(field => !record[field]);
          if (missingFields.length > 0) {
            console.warn(`Skipping record due to missing fields: ${missingFields.join(', ')}`);
            continue;
          }

          // Convert date strings to Date objects
          const detention = await db.insert(detentions).values({
            stationId: record.stationId,
            rakeId: record.rakeId,
            rakeName: record.rakeName,
            wagonType: record.wagonType,
            arrivalTime: new Date(record.arrivalTime),
            placementTime: new Date(record.placementTime),
            releaseTime: new Date(record.releaseTime),
            departureTime: new Date(record.departureTime),
            arPlReason: record.arPlReason || null,
            plRlReason: record.plRlReason || null,
            rlDpReason: record.rlDpReason || null,
            remarks: record.remarks || null,
          }).returning();

          insertedRecords.push(detention[0]);
        } catch (error) {
          console.error("Error inserting record:", error);
          // Continue with next record even if current one fails
          continue;
        }
      }

      res.json({
        success: true,
        message: "Data processed successfully",
        totalRecords: records.length,
        insertedRecords: insertedRecords.length,
        data: insertedRecords
      });
    } catch (error) {
      console.error("Error processing external data:", error);
      res.status(500).json({
        error: "Failed to process data",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Railway Loading Operations routes
  app.post("/api/railway-loading-operations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const userId = (req.user as any).id;
      const operationData = {
        ...req.body,
        userId,
        date: new Date(req.body.date),
        rrDate: new Date(req.body.rrDate),
      };

      const result = await db.insert(railwayLoadingOperations).values(operationData).returning();
      
      res.json({
        message: "Loading operation created successfully",
        operation: result[0]
      });
    } catch (error: any) {
      console.error("Error creating loading operation:", error);
      res.status(500).json({
        error: "Failed to create loading operation",
        details: error.message
      });
    }
  });

  // PDF Export Endpoints for Tables and Reports
  app.get("/api/exports/comparative-loading-pdf", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      // Generate comparative loading data directly from database
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const previousYear = currentYear - 1;
      
      const currentPeriodStart = new Date(currentYear, 5, 16); // June 16 current year
      const currentPeriodEnd = new Date(currentYear, 5, 18);   // June 18 current year
      const previousPeriodStart = new Date(previousYear, 5, 16); // June 16 previous year
      const previousPeriodEnd = new Date(previousYear, 5, 18);   // June 18 previous year

      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      };

      // Fetch current period data
      const currentData = await db.select()
        .from(railwayLoadingOperations)
        .where(and(
          gte(railwayLoadingOperations.pDate, currentPeriodStart),
          lte(railwayLoadingOperations.pDate, currentPeriodEnd)
        ));

      // Fetch previous period data
      const previousData = await db.select()
        .from(railwayLoadingOperations)
        .where(and(
          gte(railwayLoadingOperations.pDate, previousPeriodStart),
          lte(railwayLoadingOperations.pDate, previousPeriodEnd)
        ));

      const currentDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const previousDays = Math.ceil((previousPeriodEnd.getTime() - previousPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      const commodityComparison = generateCommodityComparison(currentData, previousData, currentDays, previousDays);

      // Transform the data to match the expected structure for PDF generation
      const transformedData = commodityComparison.map(item => ({
        commodity: item.commodity,
        currentPeriod: {
          rks: item.currentRks,
          avgPerDay: item.currentAvgDay,
          wagons: item.currentWagon,
          tonnage: item.currentMT,
          freight: item.currentFreight
        },
        previousPeriod: {
          rks: item.compareRks,
          avgPerDay: item.compareAvgDay,
          wagons: item.compareWagon,
          tonnage: item.compareMT,
          freight: item.compareFreight
        },
        changeInMT: item.variationUnits,
        changeInPercentage: item.variationPercent
      }));

      const data = {
        periods: {
          current: `${formatDate(currentPeriodStart)} to ${formatDate(currentPeriodEnd)}`,
          previous: `${formatDate(previousPeriodStart)} to ${formatDate(previousPeriodEnd)}`
        },
        data: transformedData,
        totals: transformedData.reduce((acc, item) => ({
          currentPeriod: {
            rks: acc.currentPeriod.rks + item.currentPeriod.rks,
            wagons: acc.currentPeriod.wagons + item.currentPeriod.wagons,
            tonnage: acc.currentPeriod.tonnage + item.currentPeriod.tonnage,
            freight: acc.currentPeriod.freight + item.currentPeriod.freight
          },
          previousPeriod: {
            rks: acc.previousPeriod.rks + item.previousPeriod.rks,
            wagons: acc.previousPeriod.wagons + item.previousPeriod.wagons,
            tonnage: acc.previousPeriod.tonnage + item.previousPeriod.tonnage,
            freight: acc.previousPeriod.freight + item.previousPeriod.freight
          }
        }), {
          currentPeriod: { rks: 0, wagons: 0, tonnage: 0, freight: 0 },
          previousPeriod: { rks: 0, wagons: 0, tonnage: 0, freight: 0 }
        })
      };

      // Generate PDF with proper A4 landscape dimensions
      const doc = new PDFDocument({ 
        margin: 0, 
        size: 'A4', 
        layout: 'landscape',
        info: {
          Title: 'Comparative Loading Analysis Report',
          Author: 'SCR Railway Operations',
          Subject: 'Railway Loading Performance Analysis',
          Keywords: 'railway, loading, comparative, analysis, SCR'
        }
      });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="comparative-loading-report.pdf"');
      
      doc.pipe(res);
      generateComparativeLoadingPDF(doc, data);
      doc.end();

    } catch (error: any) {
      console.error("Error generating comparative loading PDF:", error);
      res.status(500).json({
        error: "Failed to generate PDF",
        details: error.message
      });
    }
  });

  app.get("/api/exports/yearly-comparison-pdf", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      // Fetch yearly commodity data directly from database
      const commodityData = await db.select({
        year: sql<string>`EXTRACT(YEAR FROM ${railwayLoadingOperations.pDate})::text`,
        commodity: railwayLoadingOperations.commodity,
        totalTonnage: sql<number>`SUM(${railwayLoadingOperations.tonnage})`,
        totalWagons: sql<number>`SUM(${railwayLoadingOperations.wagons})`,
        totalFreight: sql<number>`SUM(${railwayLoadingOperations.freight})`
      })
      .from(railwayLoadingOperations)
      .groupBy(sql`EXTRACT(YEAR FROM ${railwayLoadingOperations.pDate})`, railwayLoadingOperations.commodity)
      .orderBy(sql`EXTRACT(YEAR FROM ${railwayLoadingOperations.pDate})`, railwayLoadingOperations.commodity);

      // Fetch yearly station data directly from database
      const stationData = await db.select({
        year: sql<string>`EXTRACT(YEAR FROM ${railwayLoadingOperations.pDate})::text`,
        station: railwayLoadingOperations.station,
        totalTonnage: sql<number>`SUM(${railwayLoadingOperations.tonnage})`,
        totalWagons: sql<number>`SUM(${railwayLoadingOperations.wagons})`,
        totalFreight: sql<number>`SUM(${railwayLoadingOperations.freight})`
      })
      .from(railwayLoadingOperations)
      .groupBy(sql`EXTRACT(YEAR FROM ${railwayLoadingOperations.pDate})`, railwayLoadingOperations.station)
      .orderBy(sql`EXTRACT(YEAR FROM ${railwayLoadingOperations.pDate})`, railwayLoadingOperations.station);

      // Generate PDF
      const doc = new PDFDocument({ margin: 30 });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="yearly-comparison-report.pdf"');
      
      doc.pipe(res);
      generateYearlyComparisonPDF(doc, commodityData, stationData);
      doc.end();

    } catch (error: any) {
      console.error("Error generating yearly comparison PDF:", error);
      res.status(500).json({
        error: "Failed to generate PDF",
        details: error.message
      });
    }
  });

  // Station-wise comparative loading PDF export
  app.get("/api/exports/station-comparative-loading-pdf", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const currentYear = new Date().getFullYear();
      const previousYear = currentYear - 1;
      
      // May 26-31 periods
      const currentPeriodStart = new Date(currentYear, 4, 26);
      const currentPeriodEnd = new Date(currentYear, 4, 31);
      const previousPeriodStart = new Date(previousYear, 4, 26);
      const previousPeriodEnd = new Date(previousYear, 4, 31);

      // Fetch data directly from database
      const currentData = await db.select()
        .from(railwayLoadingOperations)
        .where(and(
          gte(railwayLoadingOperations.pDate, currentPeriodStart),
          lte(railwayLoadingOperations.pDate, currentPeriodEnd)
        ));

      const previousData = await db.select()
        .from(railwayLoadingOperations)
        .where(and(
          gte(railwayLoadingOperations.pDate, previousPeriodStart),
          lte(railwayLoadingOperations.pDate, previousPeriodEnd)
        ));

      const currentDays = 6;
      const previousDays = 6;
      const stationComparison = generateStationComparison(currentData, previousData, currentDays, previousDays);

      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', { 
          day: '2-digit', 
          month: '2-digit', 
          year: 'numeric' 
        });
      };

      const data = {
        periods: {
          current: `${formatDate(currentPeriodStart)} to ${formatDate(currentPeriodEnd)}`,
          previous: `${formatDate(previousPeriodStart)} to ${formatDate(previousPeriodEnd)}`
        },
        data: stationComparison.sort((a, b) => b.currentMT - a.currentMT),
        totals: stationComparison.reduce((acc, item) => ({
          currentPeriod: {
            rks: acc.currentPeriod.rks + item.currentRks,
            wagons: acc.currentPeriod.wagons + item.currentWagon,
            tonnage: acc.currentPeriod.tonnage + item.currentMT,
            freight: acc.currentPeriod.freight + item.currentFreight,
            avgPerDay: 0
          },
          previousPeriod: {
            rks: acc.previousPeriod.rks + item.compareRks,
            wagons: acc.previousPeriod.wagons + item.compareWagon,
            tonnage: acc.previousPeriod.tonnage + item.compareMT,
            freight: acc.previousPeriod.freight + item.compareFreight,
            avgPerDay: 0
          }
        }), {
          currentPeriod: { rks: 0, wagons: 0, tonnage: 0, freight: 0, avgPerDay: 0 },
          previousPeriod: { rks: 0, wagons: 0, tonnage: 0, freight: 0, avgPerDay: 0 }
        })
      };

      data.totals.currentPeriod.avgPerDay = data.totals.currentPeriod.rks / currentDays;
      data.totals.previousPeriod.avgPerDay = data.totals.previousPeriod.rks / previousDays;

      // Generate PDF
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="station-comparative-loading-report.pdf"');
      
      doc.pipe(res);
      generateStationComparativeLoadingPDF(doc, data);
      doc.end();

      console.log("Station comparative loading PDF generation completed");
    } catch (error: any) {
      console.error("Error generating station comparative loading PDF:", error);
      res.status(500).json({
        error: "Failed to generate PDF",
        details: error.message
      });
    }
  });

  app.get("/api/exports/all-entries-pdf", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const { page = 1, limit = 1000 } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      // Fetch railway loading operations data
      const entries = await db
        .select()
        .from(railwayLoadingOperations)
        .orderBy(desc(railwayLoadingOperations.pDate))
        .limit(Number(limit))
        .offset(offset);

      // Generate PDF
      const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'landscape' });
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="railway-entries-page-${page}.pdf"`);
      
      doc.pipe(res);
      generateAllEntriesPDF(doc, entries);
      doc.end();

    } catch (error: any) {
      console.error("Error generating all entries PDF:", error);
      res.status(500).json({
        error: "Failed to generate PDF",
        details: error.message
      });
    }
  });

  app.get("/api/railway-loading-operations", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const operations = await db.select().from(railwayLoadingOperations);
      res.json(operations);
    } catch (error: any) {
      console.error("Error fetching loading operations:", error);
      res.status(500).json({
        error: "Failed to fetch loading operations",
        details: error.message
      });
    }
  });

  app.put("/api/railway-loading-operations/:id", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const { id } = req.params;
      const updateData = { ...req.body };
      
      // Handle date fields
      if (updateData.pDate) {
        updateData.pDate = new Date(updateData.pDate);
      }
      if (updateData.rrDate) {
        updateData.rrDate = new Date(updateData.rrDate);
      }

      const [updated] = await db
        .update(railwayLoadingOperations)
        .set(updateData)
        .where(eq(railwayLoadingOperations.id, parseInt(id)))
        .returning();

      if (!updated) {
        return res.status(404).json({ error: "Railway loading operation not found" });
      }

      res.json({
        message: "Loading operation updated successfully",
        operation: updated
      });
    } catch (error: any) {
      console.error("Error updating loading operation:", error);
      res.status(500).json({
        error: "Failed to update loading operation",
        details: error.message
      });
    }
  });

  app.get("/api/railway-loading-operations/dropdown-options", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      // Get distinct values for dropdown options from existing data
      const [stationsData, commoditiesData, commTypesData, commCgsData, statesData, rlysData, typesData, loadingTypesData] = await Promise.all([
        db.selectDistinct({ station: railwayLoadingOperations.station }).from(railwayLoadingOperations).where(sql`${railwayLoadingOperations.station} IS NOT NULL`),
        db.selectDistinct({ commodity: railwayLoadingOperations.commodity }).from(railwayLoadingOperations).where(sql`${railwayLoadingOperations.commodity} IS NOT NULL`),
        db.selectDistinct({ commType: railwayLoadingOperations.commType }).from(railwayLoadingOperations).where(sql`${railwayLoadingOperations.commType} IS NOT NULL`),
        db.selectDistinct({ commCg: railwayLoadingOperations.commCg }).from(railwayLoadingOperations).where(sql`${railwayLoadingOperations.commCg} IS NOT NULL`),
        db.selectDistinct({ state: railwayLoadingOperations.state }).from(railwayLoadingOperations).where(sql`${railwayLoadingOperations.state} IS NOT NULL`),
        db.selectDistinct({ rly: railwayLoadingOperations.rly }).from(railwayLoadingOperations).where(sql`${railwayLoadingOperations.rly} IS NOT NULL`),
        db.selectDistinct({ type: railwayLoadingOperations.type }).from(railwayLoadingOperations).where(sql`${railwayLoadingOperations.type} IS NOT NULL`),
        db.selectDistinct({ loadingType: railwayLoadingOperations.loadingType }).from(railwayLoadingOperations).where(sql`${railwayLoadingOperations.loadingType} IS NOT NULL`)
      ]);

      const options = {
        stations: stationsData.map(row => row.station).filter(Boolean).sort(),
        commodities: commoditiesData.map(row => row.commodity).filter(Boolean).sort(),
        commTypes: commTypesData.map(row => row.commType).filter(Boolean).sort(),
        commCgs: commCgsData.map(row => row.commCg).filter(Boolean).sort(),
        states: statesData.map(row => row.state).filter(Boolean).sort(),
        railways: rlysData.map(row => row.rly).filter(Boolean).sort(),
        wagonTypes: typesData.map(row => row.type).filter(Boolean).sort(),
        loadingTypes: loadingTypesData.map(row => row.loadingType).filter(Boolean).sort()
      };

      res.json(options);
    } catch (error: any) {
      console.error("Error fetching dropdown options:", error);
      res.status(500).json({
        error: "Failed to fetch dropdown options",
        details: error.message
      });
    }
  });

  // Daily Reports API endpoints
  app.get("/api/daily-reports", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const { currentFrom, currentTo, compareFrom, compareTo, type } = req.query;
      
      if (!currentFrom || !currentTo || !compareFrom || !compareTo) {
        return res.status(400).json({ error: "All date parameters are required" });
      }

      const currentFromDate = new Date(currentFrom as string);
      const currentToDate = new Date(currentTo as string);
      const compareFromDate = new Date(compareFrom as string);
      const compareToDate = new Date(compareTo as string);

      // Calculate days in each period
      const currentDays = Math.ceil((currentToDate.getTime() - currentFromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const compareDays = Math.ceil((compareToDate.getTime() - compareFromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Get current period data
      const currentData = await db
        .select()
        .from(railwayLoadingOperations)
        .where(
          and(
            gte(railwayLoadingOperations.pDate, currentFromDate),
            lte(railwayLoadingOperations.pDate, currentToDate)
          )
        );

      // Get comparative period data
      const compareData = await db
        .select()
        .from(railwayLoadingOperations)
        .where(
          and(
            gte(railwayLoadingOperations.pDate, compareFromDate),
            lte(railwayLoadingOperations.pDate, compareToDate)
          )
        );

      console.log(`Current period: ${currentFromDate} to ${currentToDate}, found ${currentData.length} records`);
      console.log(`Compare period: ${compareFromDate} to ${compareToDate}, found ${compareData.length} records`);

      // Process commodity-wise data
      const commodityData = generateCommodityComparison(currentData, compareData, currentDays, compareDays);
      
      // Process station-wise data
      const stationData = generateStationComparison(currentData, compareData, currentDays, compareDays);

      res.json({
        commodityData,
        stationData,
        summary: {
          currentPeriod: { from: currentFromDate, to: currentToDate, days: currentDays },
          comparePeriod: { from: compareFromDate, to: compareToDate, days: compareDays }
        }
      });

    } catch (error: any) {
      console.error("Error generating daily reports:", error);
      res.status(500).json({
        error: "Failed to generate daily reports",
        details: error.message
      });
    }
  });

  app.get("/api/daily-reports/download", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const { currentFrom, currentTo, compareFrom, compareTo, type, format: downloadFormat } = req.query;
      
      if (!currentFrom || !currentTo || !compareFrom || !compareTo) {
        return res.status(400).json({ error: "All date parameters are required" });
      }

      const currentFromDate = new Date(currentFrom as string);
      const currentToDate = new Date(currentTo as string);
      const compareFromDate = new Date(compareFrom as string);
      const compareToDate = new Date(compareTo as string);

      // Calculate days
      const currentDays = Math.ceil((currentToDate.getTime() - currentFromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const compareDays = Math.ceil((compareToDate.getTime() - compareFromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      // Get data
      const currentData = await db
        .select()
        .from(railwayLoadingOperations)
        .where(
          and(
            gte(railwayLoadingOperations.pDate, currentFromDate),
            lte(railwayLoadingOperations.pDate, currentToDate)
          )
        );

      const compareData = await db
        .select()
        .from(railwayLoadingOperations)
        .where(
          and(
            gte(railwayLoadingOperations.pDate, compareFromDate),
            lte(railwayLoadingOperations.pDate, compareToDate)
          )
        );

      if (downloadFormat === 'pdf') {
        // Generate PDF
        const doc = new PDFDocument({ margin: 50 });
        res.setHeader('Content-Type', 'application/pdf');
        const currentFromFormatted = formatDate(currentFromDate, 'dd-MM-yyyy');
        const currentToFormatted = formatDate(currentToDate, 'dd-MM-yyyy');
        res.setHeader('Content-Disposition', `attachment; filename="daily-report-${currentFromFormatted}-${currentToFormatted}.pdf"`);
        
        doc.pipe(res);
        
        // Generate PDF content
        generateDailyReportPDF(doc, currentData, compareData, currentFromDate, currentToDate, compareFromDate, compareToDate, currentDays, compareDays);
        
        doc.end();
      } else if (downloadFormat === 'excel') {
        // Generate Excel using the same data processing
        const commodityData = generateCommodityComparison(currentData, compareData, currentDays, compareDays);
        const stationData = generateStationComparison(currentData, compareData, currentDays, compareDays);
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="daily-report-${formatDate(currentFromDate, 'dd-MM-yyyy')}-${formatDate(currentToDate, 'dd-MM-yyyy')}.xlsx"`);
        
        // Create simple Excel content
        const excelData = [
          ['Commodity-wise Comparative Loading Particulars'],
          ['Commodity', 'Current Rks', 'Current Avg/Day', 'Current Wagon', 'Current MT', 'Current Freight', 'Compare Rks', 'Compare Avg/Day', 'Compare Wagon', 'Compare MT', 'Compare Freight', 'Variation Units', 'Variation %'],
          ...commodityData.map((row: any) => [
            row.commodity, row.currentRks, row.currentAvgDay, row.currentWagon, row.currentMT, row.currentFreight,
            row.compareRks, row.compareAvgDay, row.compareWagon, row.compareMT, row.compareFreight,
            row.variationUnits, row.variationPercent
          ])
        ];
        
        res.json({ data: excelData });
      }

    } catch (error: any) {
      console.error("Error downloading daily reports:", error);
      res.status(500).json({
        error: "Failed to download daily reports",
        details: error.message
      });
    }
  });

  app.post("/api/reports/generate", async (req, res) => {
    try {
      const { templateId, data, isLastChunk, totalRecords, chunkIndex } = req.body;

      if (!templateId || !data) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      // Only create a new PDF document for the first chunk
      const doc = new PDFDocument();
      const chunks: Buffer[] = [];

      // Set response headers only for the last chunk
      if (isLastChunk) {
        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
          "Content-Disposition",
          `attachment; filename=report-${formatDate(new Date(), "yyyy-MM-dd")}.pdf`
        );
      }

      // Handle document chunks
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => {
        const pdfBuffer = Buffer.concat(chunks);
        if (isLastChunk) {
          res.end(pdfBuffer);
        } else {
          res.json({ success: true, message: `Processed chunk ${chunkIndex}` });
        }
      });

      // Generate report based on template
      switch (templateId) {
        case "daily-summary":
          generateDailySummary(doc, data);
          break;
        case "efficiency-metrics":
          generateEfficiencyReport(doc, data);
          break;
        case "wagon-utilization":
          generateWagonReport(doc, data);
          break;
        default:
          throw new Error("Invalid template ID");
      }

      doc.end();
    } catch (error: any) {
      console.error("Error generating report:", error);
      if (!res.headersSent) {
        res.status(500).json({
          error: "Failed to generate report",
          details: error.message
        });
      }
    }
  });
  // Remove existing worker data endpoints and add simplified version
  app.post("/api/worker-data", async (req, res) => {
    try {
      // Validate request body
      if (!req.body || !Array.isArray(req.body.data)) {
        return res.status(400).json({
          error: "Invalid request format. Expected { data: [...] }"
        });
      }

      // Store the data in memory
      global.workerData = req.body.data;

      res.json({
        success: true,
        message: "Worker data updated successfully",
        count: req.body.data.length
      });
    } catch (error) {
      console.error("Error processing worker data:", error);
      res.status(500).json({
        error: "Failed to process worker data",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/worker-data", async (req, res) => {
    try {
      // Return the stored worker data
      res.json(global.workerData || []);
    } catch (error) {
      console.error("Error fetching worker data:", error);
      res.status(500).json({
        error: "Failed to fetch worker data",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });
  // Basic sheet data endpoint with various transformations
  app.get("/api/sheets-data", async (req, res) => {
    try {
      // Check if user is authenticated
      if (!req.isAuthenticated()) {
        console.log("Unauthorized access attempt to sheets data");
        return res.status(401).send("Not authenticated");
      }

      const { spreadsheetId, range, transform, groupBy, aggregateField } = req.query;

      if (!spreadsheetId || !range) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const transformer = await createSheetDataTransformer(spreadsheetId as string, range as string);

      // Apply transformations if specified
      if (groupBy && aggregateField) {
        const aggregated = transformer.aggregate(groupBy as string, {
          total: (values) => values.reduce((sum, v) => sum + (parseFloat(v[aggregateField as string]) || 0), 0),
          count: (values) => values.length,
        });
        return res.json(aggregated);
      }

      if (transform === 'csv') {
        return res.send(transformer.toCSV());
      }

      res.json(transformer.toJSON());
    } catch (error: any) {
      console.error("Error processing sheet data:", error);
      res.status(500).json({
        error: "Failed to process sheet data",
        details: error.message
      });
    }
  });

  // Time series analysis endpoint
  app.get("/api/sheets-data/time-series", async (req, res) => {
    try {
      const { spreadsheetId, range, dateKey, valueKey, interval } = req.query;

      if (!spreadsheetId || !range || !dateKey || !valueKey) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const transformer = await createSheetDataTransformer(spreadsheetId as string, range as string);
      const series = transformer.timeSeries(
        dateKey as string,
        valueKey as string,
        (interval as 'day' | 'week' | 'month') || 'day'
      );

      res.json(series);
    } catch (error: any) {
      console.error("Error generating time series:", error);
      res.status(500).json({
        error: "Failed to generate time series",
        details: error.message
      });
    }
  });

  // Statistical analysis endpoint
  app.get("/api/sheets-data/statistics", async (req, res) => {
    try {
      const { spreadsheetId, range, valueKey } = req.query;

      if (!spreadsheetId || !range || !valueKey) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const transformer = await createSheetDataTransformer(spreadsheetId as string, range as string);
      const stats = transformer.calculateStatistics(valueKey as string);

      res.json(stats);
    } catch (error: any) {
      console.error("Error calculating statistics:", error);
      res.status(500).json({
        error: "Failed to calculate statistics",
        details: error.message
      });
    }
  });

  // Pivot table endpoint
  app.get("/api/sheets-data/pivot", async (req, res) => {
    try {
      const { spreadsheetId, range, rowKey, colKey, valueKey } = req.query;

      if (!spreadsheetId || !range || !rowKey || !colKey || !valueKey) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      const transformer = await createSheetDataTransformer(spreadsheetId as string, range as string);
      const pivotData = transformer.pivotTable(
        rowKey as string,
        colKey as string,
        valueKey as string,
        values => values.reduce((sum, v) => sum + (parseFloat(v) || 0), 0)
      );

      res.json(pivotData);
    } catch (error: any) {
      console.error("Error generating pivot table:", error);
      res.status(500).json({
        error: "Failed to generate pivot table",
        details: error.message
      });
    }
  });

  // New routes for interchange data
  app.get("/api/interchange/:station", async (req, res) => {
    try {
      const { station } = req.params;

      const [data] = await db
        .select()
        .from(interchangeData)
        .where(eq(interchangeData.station, station))
        .orderBy(interchangeData.updatedAt)
        .limit(1);

      // Return empty train entries if no data exists
      res.json(data || { trainEntries: {} });
    } catch (error: any) {
      console.error("Error fetching interchange data:", error);
      res.status(500).json({
        error: "Failed to fetch interchange data",
        details: error.message
      });
    }
  });

  app.post("/api/interchange/:station", async (req, res) => {
    try {
      // Only require authentication, no need to check specific user
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const { station } = req.params;
      const { trainEntries } = req.body;

      // Update or insert interchange data
      const [updated] = await db
        .insert(interchangeData)
        .values({
          station,
          trainEntries,
          updatedBy: req.user!.id,
        })
        .onConflictDoUpdate({
          target: interchangeData.station,
          set: {
            trainEntries,
            updatedAt: new Date(),
            updatedBy: req.user!.id,
          },
        })
        .returning();

      res.json(updated);
    } catch (error: any) {
      console.error("Error updating interchange data:", error);
      res.status(500).json({
        error: "Failed to update interchange data",
        details: error.message
      });
    }
  });

  // Enhanced sheet search endpoint
  app.get("/api/sheets-search", async (req, res) => {
    try {
      const { query, spreadsheetId, range } = req.query;

      if (!spreadsheetId || !range) {
        return res.status(400).json({ error: "Missing required parameters" });
      }

      console.log("Sheets search params:", { spreadsheetId, range, query });

      const transformer = await createSheetDataTransformer(spreadsheetId as string, range as string);
      const data = transformer.toJSON();

      console.log("Sheets data retrieved:", {
        dataLength: data?.length || 0,
        sampleData: data?.[0]
      });

      // If no search query, return all data
      if (!query) {
        return res.json(data);
      }

      // Search through the data
      const searchResults = data.filter((row: any) => {
        const searchStr = query.toString().toLowerCase();
        return Object.values(row).some(value =>
          value && value.toString().toLowerCase().includes(searchStr)
        );
      });

      console.log("Search results:", {
        resultsLength: searchResults?.length || 0,
        sampleResult: searchResults?.[0]
      });

      res.json(searchResults);
    } catch (error: any) {
      console.error("Error searching sheets:", error);
      res.status(500).json({
        error: "Failed to search sheets",
        details: error.message
      });
    }
  });

  app.post("/api/upload/validate", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = read(req.file.buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      // Validate the structure
      const validationErrors: string[] = [];
      const validRows: any[] = [];

      jsonData.forEach((row: any, index: number) => {
        const rowErrors: string[] = [];

        // Required fields
        const requiredFields = [
          "stationId", "rakeId", "rakeName", "wagonType",
          "arrivalDateTime", "placementDateTime", "releaseDateTime", "departureDateTime"
        ];

        requiredFields.forEach(field => {
          if (!row[field]) {
            rowErrors.push(`Missing ${field}`);
          }
        });

        // Date validation - expecting DD-MM-YYYY HH:mm format
        const dateFields = ["arrivalDateTime", "placementDateTime", "releaseDateTime", "departureDateTime"];
        dateFields.forEach(field => {
          if (row[field]) {
            try {
              // Convert any date object to string and trim
              const rawValue = row[field];
              console.log(`Raw ${field} value:`, rawValue, 'Type:', typeof rawValue);

              // Handle Excel date objects by formatting them
              let dateStr;
              if (typeof rawValue === 'number') {
                // Excel stores dates as days since December 30, 1899
                const date = new Date((rawValue - 25569) * 86400 * 1000);
                dateStr = formatDate(date, 'dd-MM-yyyy HH:mm');
              } else if (rawValue instanceof Date) {
                dateStr = formatDate(rawValue, 'dd-MM-yyyy HH:mm');
              } else {
                dateStr = rawValue.toString().trim();
              }

              console.log(`Formatted ${field} string:`, dateStr);

              // Validate format using regex before parsing
              const dateRegex = /^(\d{2})-(\d{2})-(\d{4})\s+(\d{2}):(\d{2})$/;
              if (!dateRegex.test(dateStr)) {
                rowErrors.push(`Invalid date format for ${field}. Expected format: DD-MM-YYYY HH:mm, got: ${dateStr}`);
                return; // Use return instead of continue in forEach
              }

              // Parse the date string to validate it's a real date
              const date = parse(dateStr, 'dd-MM-yyyy HH:mm', new Date());
              console.log(`Parsed ${field} date:`, date);

              if (isNaN(date.getTime())) {
                rowErrors.push(`Invalid date for ${field}. The date ${dateStr} is not a valid date.`);
                return; // Use return instead of continue in forEach
              }

              // Store the formatted date string back in the row
              row[field] = dateStr;
            } catch (error) {
              console.error(`Error parsing date for ${field}:`, error);
              rowErrors.push(`Error parsing date for ${field}. Expected format: DD-MM-YYYY HH:mm. Error: ${error instanceof Error ? error.message : String(error)}`);
            }
          }
        });

        if (rowErrors.length > 0) {
          validationErrors.push(`Row ${index + 2}: ${rowErrors.join(", ")}`);
        } else {
          validRows.push(row);
        }
      });

      if (validationErrors.length > 0) {
        return res.json({
          success: false,
          errors: validationErrors,
          validRows: validRows.length,
          totalRows: jsonData.length
        });
      }

      res.json({
        success: true,
        validRows: validRows.length,
        totalRows: jsonData.length,
        previewData: validRows.slice(0, 5) // Send first 5 rows as preview
      });
    } catch (error: any) {
      console.error("Error validating Excel file:", error);
      res.status(500).json({
        error: "Failed to process Excel file",
        details: error.message
      });
    }
  });

  app.post("/api/upload/import", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const workbook = read(req.file.buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      const importedData = await Promise.all(
        jsonData.map(async (row: any) => {
          try {
            // Handle optional fields
            const arPlReason = row.arPlReason || null;
            const plRlReason = row.plRlReason || null;
            const rlDpReason = row.rlDpReason || null;
            const remarks = row.remarks || null;

            // Format dates properly before parsing
            const formatExcelDate = (value: any) => {
              if (typeof value === 'number') {
                // Excel stores dates as days since December 30, 1899
                const date = new Date((value - 25569) * 86400 * 1000);
                return formatDate(date, 'dd-MM-yyyy HH:mm');
              } else if (value instanceof Date) {
                return formatDate(value, 'dd-MM-yyyy HH:mm');
              }
              return value.toString().trim();
            };

            // Parse dates from DD-MM-YYYY HH:mm format
            const arrivalTime = parse(formatExcelDate(row.arrivalDateTime), 'dd-MM-yyyy HH:mm', new Date());
            const placementTime = parse(formatExcelDate(row.placementDateTime), 'dd-MM-yyyy HH:mm', new Date());
            const releaseTime = parse(formatExcelDate(row.releaseDateTime), 'dd-MM-yyyy HH:mm', new Date());
            const departureTime = parse(formatExcelDate(row.departureDateTime), 'dd-MM-yyyy HH:mm', new Date());

            const detention = await db.insert(detentions).values({
              stationId: row.stationId,
              rakeId: row.rakeId,
              rakeName: row.rakeName,
              wagonType: row.wagonType,
              arrivalTime,
              placementTime,
              releaseTime,
              departureTime,
              arPlReason,
              plRlReason,
              rlDpReason,
              remarks,
            }).returning();

            return detention[0];
          } catch (error) {
            console.error("Error importing row:", error);
            return null;
          }
        })
      );

      const successfulImports = importedData.filter(d => d !== null);

      res.json({
        success: true,
        importedCount: successfulImports.length,
        totalRows: jsonData.length
      });
    } catch (error: any) {
      console.error("Error importing Excel file:", error);
      res.status(500).json({
        error: "Failed to import Excel file",
        details: error.message
      });
    }
  });

  // Add new routes for Access database sync
  app.post("/api/access-sync/initialize", async (req, res) => {
    try {
      const { driveFileId } = req.body;

      if (!driveFileId) {
        return res.status(400).json({ error: "Google Drive File ID is required" });
      }

      const data = await initializeAccessSync(driveFileId);
      res.json({
        success: true,
        message: "Access database sync initialized successfully",
        tables: Object.keys(data)
      });
    } catch (error) {
      console.error("Error initializing Access sync:", error);
      res.status(500).json({
        error: "Failed to initialize Access sync",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/access-sync/status", async (req, res) => {
    try {
      const data = await syncAccessData();
      res.json({
        success: true,
        tables: Object.keys(data),
        lastSync: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error checking Access sync status:", error);
      res.status(500).json({
        error: "Failed to check Access sync status",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Add new endpoint for railway loading operations reports
  app.get("/api/reports/railway-operations", async (req, res) => {
    try {
      const { groupBy } = req.query;

      if (!groupBy || !['commodity', 'station'].includes(groupBy as string)) {
        return res.status(400).json({ error: "Invalid groupBy parameter. Use 'commodity' or 'station'" });
      }

      let result;
      if (groupBy === 'commodity') {
        result = await db
          .select({
            commodity: railwayLoadingOperations.commodity,
            totalWagons: sql`sum(${railwayLoadingOperations.wagons})::integer`,
            totalUnits: sql`sum(${railwayLoadingOperations.units})::integer`,
            totalTonnage: sql`sum(${railwayLoadingOperations.tonnage})::numeric`,
            totalFreight: sql`sum(${railwayLoadingOperations.freight})::numeric`,
            recordCount: sql`count(*)::integer`
          })
          .from(railwayLoadingOperations)
          .groupBy(railwayLoadingOperations.commodity)
          .having(sql`${railwayLoadingOperations.commodity} is not null`);} else {
        result = await db
          .select({
            station: railwayLoadingOperations.station,
            totalWagons: sql`sum(${railwayLoadingOperations.wagons})::integer`,
            totalUnits: sql`sum(${railwayLoadingOperations.units})::integer`,
            totalTonnage: sql`sum(${railwayLoadingOperations.tonnage})::numeric`,
            totalFreight: sql`sum(${railwayLoadingOperations.freight})::numeric`,
            recordCount: sql`count(*)::integer`
          })
          .from(railwayLoadingOperations)
          .groupBy(railwayLoadingOperations.station)
          .having(sql`${railwayLoadingOperations.station} is not null`);
      }

      res.json(result);
    } catch (error) {
      console.error("Error generating railway operations report:", error);
      res.status(500).json({
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Add new endpoint for combined commodity-station report
  app.get("/api/reports/railway-operations/combined", async (req, res) => {
    try {
      // First get total sums for percentage calculations
      const [totals] = await db
        .select({
          totalWagons: sql`sum(${railwayLoadingOperations.wagons})::integer`,
          totalUnits: sql`sum(${railwayLoadingOperations.units})::integer`,
          totalTonnage: sql`sum(${railwayLoadingOperations.tonnage})::numeric`,
          totalFreight: sql`sum(${railwayLoadingOperations.freight})::numeric`,
        })
        .from(railwayLoadingOperations);

      // Get commodity level data
      const commodities = await db
        .select({
          commodity: railwayLoadingOperations.commodity,
          totalWagons: sql`sum(${railwayLoadingOperations.wagons})::integer`,
          totalUnits: sql`sum(${railwayLoadingOperations.units})::integer`,
          totalTonnage: sql`sum(${railwayLoadingOperations.tonnage})::numeric`,
          totalFreight: sql`sum(${railwayLoadingOperations.freight})::numeric`,
          recordCount: sql`count(*)::integer`
        })
        .from(railwayLoadingOperations)
        .groupBy(railwayLoadingOperations.commodity)
        .having(sql`${railwayLoadingOperations.commodity} is not null`);

      // Get station breakdown for each commodity
      const result = await Promise.all(commodities.map(async (commodity) => {
        const stations = await db
          .select({
            station: railwayLoadingOperations.station,
            totalWagons: sql`sum(${railwayLoadingOperations.wagons})::integer`,
            totalUnits: sql`sum(${railwayLoadingOperations.units})::integer`,
            totalTonnage: sql`sum(${railwayLoadingOperations.tonnage})::numeric`,
            totalFreight: sql`sum(${railwayLoadingOperations.freight})::numeric`,
            recordCount: sql`count(*)::integer`
          })
          .from(railwayLoadingOperations)
          .where(eq(railwayLoadingOperations.commodity, commodity.commodity))
          .groupBy(railwayLoadingOperations.station)
          .having(sql`${railwayLoadingOperations.station} is not null`);

        return {
          ...commodity,
          wagonsPercentage: ((commodity.totalWagons / totals.totalWagons) * 100).toFixed(1),
          unitsPercentage: ((commodity.totalUnits / totals.totalUnits) * 100).toFixed(1),
          tonnagePercentage: ((commodity.totalTonnage / totals.totalTonnage) * 100).toFixed(1),
          freightPercentage: ((commodity.totalFreight / totals.totalFreight) * 100).toFixed(1),
          stations: stations.map(station => ({
            ...station,
            wagonsPercentage: ((station.totalWagons / commodity.totalWagons) * 100).toFixed(1),
            unitsPercentage: ((station.totalUnits / commodity.totalUnits) * 100).toFixed(1),
            tonnagePercentage: ((station.totalTonnage / commodity.totalTonnage) * 100).toFixed(1),
            freightPercentage: ((station.totalFreight / commodity.totalFreight) * 100).toFixed(1),
          }))
        };
      }));

      res.json({ totals, data: result });
    } catch (error) {
      console.error("Error generating combined railway operations report:", error);
      res.status(500).json({
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Add new endpoint for yearly commodity-station report with date filters
  app.get("/api/reports/railway-operations/yearly", async (req, res) => {
    try {
      const { startDate, endDate } = req.query;
      let dateCondition = undefined;

      if (startDate && endDate) {
        dateCondition = and(
          gte(railwayLoadingOperations.pDate, new Date(startDate as string)),
          lte(railwayLoadingOperations.pDate, new Date(endDate as string))
        );
      }

      // First, get financial year totals
      const yearsResult = await db.execute(sql`
        WITH financial_years AS (
          SELECT 
            CASE 
              WHEN EXTRACT(MONTH FROM p_date) >= 4 
              THEN CONCAT(EXTRACT(YEAR FROM p_date)::text, '-', RIGHT((EXTRACT(YEAR FROM p_date) + 1)::text, 2))
              ELSE CONCAT((EXTRACT(YEAR FROM p_date) - 1)::text, '-', RIGHT(EXTRACT(YEAR FROM p_date)::text, 2))
            END as year,
            wagons,
            units,
            tonnage,
            freight
          FROM railway_loading_operations
          WHERE ${dateCondition ? sql`p_date BETWEEN ${new Date(startDate as string)} AND ${new Date(endDate as string)}` : sql`1=1`}
        )
        SELECT 
          year,
          SUM(wagons)::integer as total_wagons,
          SUM(units)::integer as total_units,
          SUM(tonnage)::numeric as total_tonnage,
          SUM(freight)::numeric as total_freight
        FROM financial_years
        GROUP BY year
        ORDER BY year DESC
        LIMIT 2
      `);

      const years = yearsResult.rows.map(row => ({
        year: row.year,
        totalWagons: parseInt(row.total_wagons) || 0,
        totalUnits: parseInt(row.total_units) || 0,
        totalTonnage: parseFloat(row.total_tonnage) || 0,
        totalFreight: parseFloat(row.total_freight) || 0
      }));

      // Then get commodity data for each financial year
      const commodityData = await Promise.all(
        years.map(async ({ year }) => {
          const [startYear, endYear] = year.split('-');
          const fyStartDate = `${startYear}-04-01`;
          const fyEndDate = `20${endYear}-03-31`;

          const commoditiesResult = await db.execute(sql`
            WITH commodity_totals AS (
              SELECT 
                commodity,
                SUM(wagons)::integer as total_wagons,
                SUM(units)::integer as total_units,
                SUM(tonnage)::numeric as total_tonnage,
                SUM(freight)::numeric as total_freight,
                COUNT(*)::integer as record_count
              FROM railway_loading_operations
              WHERE 
                ${dateCondition ? sql`p_date BETWEEN ${new Date(startDate as string)} AND ${new Date(endDate as string)}` : sql`1=1`}
                AND p_date BETWEEN ${new Date(fyStartDate)} AND ${new Date(fyEndDate)}
                AND commodity IS NOT NULL
              GROUP BY commodity
            )
            SELECT 
              ct.*,
              json_agg(
                json_build_object(
                  'station', s.station,
                  'totalWagons', s.total_wagons,
                  'totalUnits', s.total_units,
                  'totalTonnage', s.total_tonnage,
                  'totalFreight', s.total_freight,
                  'recordCount', s.record_count,
                  'wagonsPercentage', ROUND((s.total_wagons::numeric / NULLIF(ct.total_wagons, 0) * 100)::numeric, 1),
                  'unitsPercentage', ROUND((s.total_units::numeric / NULLIF(ct.total_units, 0) * 100)::numeric, 1),
                  'tonnagePercentage', ROUND((s.total_tonnage / NULLIF(ct.total_tonnage, 0) * 100)::numeric, 1),
                  'freightPercentage', ROUND((s.total_freight / NULLIF(ct.total_freight, 0) * 100)::numeric, 1)
                )
              ) as stations
            FROM commodity_totals ct
            LEFT JOIN LATERAL (
              SELECT 
                station,
                SUM(wagons)::integer as total_wagons,
                SUM(units)::integer as total_units,
                SUM(tonnage)::numeric as total_tonnage,
                SUM(freight)::numeric as total_freight,
                COUNT(*)::integer as record_count
              FROM railway_loading_operations
              WHERE 
                ${dateCondition ? sql`p_date BETWEEN ${new Date(startDate as string)} AND ${new Date(endDate as string)}` : sql`1=1`}
                AND p_date BETWEEN ${new Date(fyStartDate)} AND ${new Date(fyEndDate)}
                AND commodity = ct.commodity
                AND station IS NOT NULL
              GROUP BY station
            ) s ON true
            GROUP BY ct.commodity, ct.total_wagons, ct.total_units, ct.total_tonnage, ct.total_freight, ct.record_count
          `);

          const yearTotal = years.find(y => y.year === year)!;

          const commodities = commoditiesResult.rows.map(row => ({
            commodity: row.commodity,
            totalWagons: parseInt(row.total_wagons) || 0,
            totalUnits: parseInt(row.total_units) || 0,
            totalTonnage: parseFloat(row.total_tonnage) || 0,
            totalFreight: parseFloat(row.total_freight) || 0,
            recordCount: parseInt(row.record_count) || 0,
            wagonsPercentage: ((parseInt(row.total_wagons) || 0) / (yearTotal.totalWagons || 1) * 100).toFixed(1),
            unitsPercentage: ((parseInt(row.total_units) || 0) / (yearTotal.totalUnits || 1) * 100).toFixed(1),
            tonnagePercentage: ((parseFloat(row.total_tonnage) || 0) / (yearTotal.totalTonnage || 1) * 100).toFixed(1),
            freightPercentage: ((parseFloat(row.total_freight) || 0) / (yearTotal.totalFreight || 1) * 100).toFixed(1),
            stations: row.stations || []
          }));

          return {
            year,
            data: commodities
          };
        })
      );

      res.json({
        years,
        commodityData
      });
    } catch (error) {
      console.error("Error generating railway operations report:", error);
      res.status(500).json({
        error: "Failed to generate report",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get all railway loading operations with pagination and filtering
  app.get("/api/railway-loading-operations/all", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { 
        page = '1', 
        pageSize = '50', 
        search = '', 
        station = '', 
        commodity = '', 
        sortBy = 'pDate', 
        sortOrder = 'desc' 
      } = req.query;

      const pageNum = parseInt(page as string);
      const pageSizeNum = parseInt(pageSize as string);
      const offset = (pageNum - 1) * pageSizeNum;

      // Build where conditions
      const conditions = [];
      
      if (search) {
        conditions.push(sql`(
          ${railwayLoadingOperations.station} ILIKE ${`%${search}%`} OR
          ${railwayLoadingOperations.commodity} ILIKE ${`%${search}%`} OR
          ${railwayLoadingOperations.siding} ILIKE ${`%${search}%`} OR
          ${railwayLoadingOperations.type} ILIKE ${`%${search}%`}
        )`);
      }

      if (station && station !== 'all') {
        conditions.push(eq(railwayLoadingOperations.station, station as string));
      }

      if (commodity && commodity !== 'all') {
        conditions.push(eq(railwayLoadingOperations.commodity, commodity as string));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get total count
      const totalResult = await db
        .select({ count: sql`count(*)` })
        .from(railwayLoadingOperations)
        .where(whereClause);
      
      const totalRecords = Number(totalResult[0].count);
      const totalPages = Math.ceil(totalRecords / pageSizeNum);

      // Get data with sorting
      const sortColumn = railwayLoadingOperations[sortBy as keyof typeof railwayLoadingOperations] || railwayLoadingOperations.pDate;
      const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

      const data = await db
        .select()
        .from(railwayLoadingOperations)
        .where(whereClause)
        .orderBy(orderDirection === 'asc' ? sortColumn : sql`${sortColumn} DESC`)
        .limit(pageSizeNum)
        .offset(offset);

      res.json({
        data,
        totalRecords,
        totalPages,
        currentPage: pageNum,
        pageSize: pageSizeNum
      });
    } catch (error) {
      console.error("Error fetching all entries:", error);
      res.status(500).json({ error: "Failed to fetch entries" });
    }
  });

  // Export railway loading operations data
  app.get("/api/railway-loading-operations/export", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    try {
      const { search = '', station = '', commodity = '', sortBy = 'pDate', sortOrder = 'desc', format = 'csv' } = req.query;

      // Build where conditions (same as above)
      const conditions = [];
      
      if (search) {
        conditions.push(sql`(
          ${railwayLoadingOperations.station} ILIKE ${`%${search}%`} OR
          ${railwayLoadingOperations.commodity} ILIKE ${`%${search}%`} OR
          ${railwayLoadingOperations.siding} ILIKE ${`%${search}%`} OR
          ${railwayLoadingOperations.type} ILIKE ${`%${search}%`}
        )`);
      }

      if (station && station !== 'all') {
        conditions.push(eq(railwayLoadingOperations.station, station as string));
      }

      if (commodity && commodity !== 'all') {
        conditions.push(eq(railwayLoadingOperations.commodity, commodity as string));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      // Get all data for export
      const sortColumn = railwayLoadingOperations[sortBy as keyof typeof railwayLoadingOperations] || railwayLoadingOperations.pDate;
      const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';

      const data = await db
        .select()
        .from(railwayLoadingOperations)
        .where(whereClause)
        .orderBy(orderDirection === 'asc' ? sortColumn : sql`${sortColumn} DESC`);

      if (format === 'excel') {
        // Create Excel file
        const { utils: xlsxUtils, write } = require('xlsx');
        
        // Convert data to Excel format
        const excelData = data.map(row => ({
          'Date': row.pDate ? formatDate(new Date(row.pDate), 'dd-MM-yyyy') : '',
          'Station': row.station || '',
          'Siding': row.siding || '',
          'Commodity': row.commodity || '',
          'Comm Type': row.commType || '',
          'Comm CG': row.commCg || '',
          'Demand': row.demand || '',
          'State': row.state || '',
          'Railway': row.rly || '',
          'Wagons': row.wagons || 0,
          'Type': row.type || '',
          'Units': row.units || 0,
          'Loading Type': row.loadingType || '',
          'RR No From': row.rrNoFrom || '',
          'RR No To': row.rrNoTo || '',
          'RR Date': row.rrDate ? formatDate(new Date(row.rrDate), 'dd-MM-yyyy') : '',
          'Tonnage': row.tonnage || 0,
          'Freight': row.freight || 0
        }));

        const worksheet = xlsxUtils.json_to_sheet(excelData);
        const workbook = xlsxUtils.book_new();
        xlsxUtils.book_append_sheet(workbook, worksheet, 'Railway Operations');

        const buffer = write(workbook, { type: 'buffer', bookType: 'xlsx' });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename="railway-operations-${formatDate(new Date(), 'yyyy-MM-dd')}.xlsx"`);
        res.send(buffer);
      } else {
        // Create CSV
        const headers = [
          'Date', 'Station', 'Siding', 'Commodity', 'Comm Type', 'Comm CG', 'Demand', 
          'State', 'Railway', 'Wagons', 'Type', 'Units', 'Loading Type', 
          'RR No From', 'RR No To', 'RR Date', 'Tonnage', 'Freight'
        ];

        const csvRows = [
          headers.join(','),
          ...data.map(row => [
            row.pDate ? formatDate(new Date(row.pDate), 'dd-MM-yyyy') : '',
            `"${row.station || ''}"`,
            `"${row.siding || ''}"`,
            `"${row.commodity || ''}"`,
            `"${row.commType || ''}"`,
            `"${row.commCg || ''}"`,
            `"${row.demand || ''}"`,
            `"${row.state || ''}"`,
            `"${row.rly || ''}"`,
            row.wagons || 0,
            `"${row.type || ''}"`,
            row.units || 0,
            `"${row.loadingType || ''}"`,
            row.rrNoFrom || '',
            row.rrNoTo || '',
            row.rrDate ? formatDate(new Date(row.rrDate), 'dd-MM-yyyy') : '',
            row.tonnage || 0,
            row.freight || 0
          ].join(','))
        ];

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="railway-operations-${formatDate(new Date(), 'yyyy-MM-dd')}.csv"`);
        res.send(csvRows.join('\n'));
      }
    } catch (error) {
      console.error("Error exporting data:", error);
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  // Validate Excel file before import
  app.post("/api/railway-operations/validate", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fromDate = req.body.fromDate ? new Date(req.body.fromDate) : null;
      const toDate = req.body.toDate ? new Date(req.body.toDate) : null;

      if (!fromDate || !toDate) {
        return res.status(400).json({ error: "Date range is required" });
      }

      const workbook = read(req.file.buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      const errors: string[] = [];
      const validRows: any[] = [];
      let duplicates = 0;
      let dateFilteredOut = 0;

      // Log first few rows to understand structure
      console.log('First 3 rows from Excel:', jsonData.slice(0, 3));
      console.log('Column headers found:', Object.keys(jsonData[0] || {}));

      // Validate each row
      jsonData.forEach((row: any, index: number) => {
        const rowNum = index + 2; // Excel row number (starting from 2)
        
        // Only P DATE is required - all other columns can be blank
        if (!row['P DATE']) {
          console.log(`Row ${rowNum} missing P DATE:`, row);
          errors.push(`Row ${rowNum}: P DATE is required`);
        }

        // Validate data types
        if (row['WAGONS'] && isNaN(Number(row['WAGONS']))) {
          errors.push(`Row ${rowNum}: WAGONS must be a number`);
        }
        if (row['UNITS'] && isNaN(Number(row['UNITS']))) {
          errors.push(`Row ${rowNum}: UNITS must be a number`);
        }
        if (row['TONNAGE'] && isNaN(Number(row['TONNAGE']))) {
          errors.push(`Row ${rowNum}: TONNAGE must be a number`);
        }
        if (row['FREIGHT'] && isNaN(Number(row['FREIGHT']))) {
          errors.push(`Row ${rowNum}: FREIGHT must be a number`);
        }

        // Validate date format and range (allow blank P DATE)
        if (row['P DATE']) {
          try {
            let rowDate;
            const dateValue = row['P DATE'];
            
            // Handle Excel serial number dates
            if (typeof dateValue === 'number') {
              // Convert Excel serial number to JavaScript Date
              // Excel serial date 1 = January 1, 1900
              // But Excel incorrectly treats 1900 as a leap year, so we need to subtract 1 for dates after Feb 28, 1900
              const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
              rowDate = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
              
              // Adjust for Excel's leap year bug (Excel thinks 1900 was a leap year)
              if (dateValue > 59) { // After Feb 28, 1900
                rowDate = new Date(rowDate.getTime() - 24 * 60 * 60 * 1000);
              }
            } else {
              const dateStr = dateValue.toString();
              // Handle dd-mm-yyyy format
              if (dateStr.includes('-') && dateStr.split('-').length === 3) {
                const parts = dateStr.split('-');
                if (parts[0].length <= 2) { // dd-mm-yyyy format
                  rowDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                } else { // yyyy-mm-dd format
                  rowDate = new Date(dateStr);
                }
              } else {
                rowDate = new Date(dateValue);
              }
            }
            
            if (isNaN(rowDate.getTime())) {
              errors.push(`Row ${rowNum}: P DATE must be a valid date`);
            } else {
              // Check if date is within range
              if (rowDate < fromDate || rowDate > toDate) {
                dateFilteredOut++;
                return; // Skip this row
              }
            }
          } catch {
            errors.push(`Row ${rowNum}: P DATE must be a valid date`);
          }
        }

        if (errors.length === 0 || errors.filter(e => e.includes(`Row ${rowNum}:`)).length === 0) {
          validRows.push(row);
        }
      });

      // Check for duplicates (simplified check based on date, station, and commodity)
      const seen = new Set();
      validRows.forEach(row => {
        const key = `${row['P DATE']}-${row['STATION']}-${row['COMMODITY']}`;
        if (seen.has(key)) {
          duplicates++;
        }
        seen.add(key);
      });

      // Convert first P DATE to show actual date
      if (jsonData.length > 0 && jsonData[0]['P DATE']) {
        const firstDate = jsonData[0]['P DATE'];
        if (typeof firstDate === 'number') {
          const excelEpoch = new Date(1900, 0, 1);
          let convertedDate = new Date(excelEpoch.getTime() + (firstDate - 1) * 24 * 60 * 60 * 1000);
          if (firstDate > 59) {
            convertedDate = new Date(convertedDate.getTime() - 24 * 60 * 60 * 1000);
          }
          console.log(`Excel serial ${firstDate} converts to date: ${convertedDate.toISOString().split('T')[0]}`);
        }
      }

      console.log(`Validation results: ${errors.length} errors, ${validRows.length} valid rows out of ${jsonData.length} total rows`);
      if (errors.length > 0) {
        console.log('First 5 errors:', errors.slice(0, 5));
      }

      const result = {
        success: errors.length === 0,
        errors: errors.slice(0, 20), // Limit to first 20 errors
        validRows: validRows.length,
        totalRows: jsonData.length,
        duplicates,
        dateFilteredOut,
        previewData: validRows.slice(0, 10).map(row => {
          // Convert P DATE for display
          let displayDate = row['P DATE'];
          if (typeof row['P DATE'] === 'number') {
            const excelEpoch = new Date(1900, 0, 1);
            let convertedDate = new Date(excelEpoch.getTime() + (row['P DATE'] - 1) * 24 * 60 * 60 * 1000);
            if (row['P DATE'] > 59) {
              convertedDate = new Date(convertedDate.getTime() - 24 * 60 * 60 * 1000);
            }
            displayDate = convertedDate.toISOString().split('T')[0]; // YYYY-MM-DD format
          }
          
          return {
            pDate: displayDate,
            station: row['STATION'],
            siding: row['SIDING'],
            commodity: row['COMMODITY'],
            commType: row['COMM TYPE'],
            wagons: parseInt(row['WAGONS']) || 0,
            units: parseInt(row['UNITS']) || 0,
            tonnage: parseFloat(row['TONNAGE']) || 0,
            freight: parseFloat(row['FREIGHT']) || 0,
            type: row['TYPE']
          };
        })
      };

      res.json(result);
    } catch (error: any) {
      console.error("Error validating Excel file:", error);
      res.status(500).json({
        error: "Failed to validate Excel file",
        details: error.message
      });
    }
  });

  app.post("/api/railway-operations/import", upload.single("file"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const fromDate = req.body.fromDate ? new Date(req.body.fromDate) : null;
      const toDate = req.body.toDate ? new Date(req.body.toDate) : null;

      // Clear existing data
      await db.delete(railwayLoadingOperations);
      
      console.log("Starting direct import without validation...");

      const workbook = read(req.file.buffer);
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = utils.sheet_to_json(worksheet);

      // Filter data by date range (P DATE is required)
      const filteredData = jsonData.filter((row: any) => {
        if (!row['P DATE']) return false; // Exclude rows without P DATE
        try {
          let rowDate;
          const dateValue = row['P DATE'];
          
          // Handle Excel serial number dates
          if (typeof dateValue === 'number') {
            // Convert Excel serial number to JavaScript Date
            const excelEpoch = new Date(1900, 0, 1); // January 1, 1900
            rowDate = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
            
            // Adjust for Excel's leap year bug
            if (dateValue > 59) { // After Feb 28, 1900
              rowDate = new Date(rowDate.getTime() - 24 * 60 * 60 * 1000);
            }
          } else {
            const dateStr = dateValue.toString();
            // Handle dd-mm-yyyy format
            if (dateStr.includes('-') && dateStr.split('-').length === 3) {
              const parts = dateStr.split('-');
              if (parts[0].length <= 2) { // dd-mm-yyyy format
                rowDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
              } else { // yyyy-mm-dd format
                rowDate = new Date(dateStr);
              }
            } else {
              rowDate = new Date(dateValue);
            }
          }
          
          return !isNaN(rowDate.getTime()) && rowDate >= fromDate && rowDate <= toDate;
        } catch {
          return false; // Exclude rows with invalid dates
        }
      });

      const batchSize = 100;
      const results = [];

      for (let i = 0; i < filteredData.length; i += batchSize) {
        const batch = filteredData.slice(i, Math.min(i + batchSize, filteredData.length));
        try {
          const insertedBatch = await Promise.all(
            batch.map(async (row: any) => {
              // Parse pDate with Excel serial number and dd-mm-yyyy format handling
              let pDate = null;
              if (row['P DATE']) {
                const dateValue = row['P DATE'];
                
                // Handle Excel serial number dates
                if (typeof dateValue === 'number') {
                  const excelEpoch = new Date(1900, 0, 1);
                  pDate = new Date(excelEpoch.getTime() + (dateValue - 1) * 24 * 60 * 60 * 1000);
                  
                  if (dateValue > 59) {
                    pDate = new Date(pDate.getTime() - 24 * 60 * 60 * 1000);
                  }
                } else {
                  const dateStr = dateValue.toString();
                  if (dateStr.includes('-') && dateStr.split('-').length === 3) {
                    const parts = dateStr.split('-');
                    if (parts[0].length <= 2) {
                      pDate = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                    } else {
                      pDate = new Date(dateStr);
                    }
                  } else {
                    pDate = new Date(dateValue);
                  }
                }
              }

              return db.insert(railwayLoadingOperations).values({
                pDate: pDate,
                station: row['STATION'],
                siding: row['SIDING'],
                imported: row['IMPORTED'],
                commodity: row['COMMODITY'],
                commType: row['COMM TYPE'],
                commCg: row['COMM CG'],
                demand: row['DEMAND'],
                state: row['STATE'],
                rly: row['RLY'],
                wagons: row['WAGONS'] ? parseInt(row['WAGONS']) : null,
                type: row['TYPE'],
                units: row['UNITS'] ? parseInt(row['UNITS']) : null,
                loadingType: row['LOADING TYPE'],
                rrNoFrom: row['RR NO FROM'] ? parseInt(row['RR NO FROM']) : null,
                rrNoTo: row['RR NO TO'] ? parseInt(row['RR NO TO']) : null,
                rrDate: row['RR DATE'] ? new Date(row['RR DATE']) : null,
                tonnage: row['TONNAGE'] ? parseFloat(row['TONNAGE']) : null,
                freight: row['FREIGHT'] ? parseFloat(row['FREIGHT']) : null,
                tIndents: row['T_INDENTS'] ? parseInt(row['T_INDENTS']) : null,
                osIndents: row['O/S INDENTS'] ? parseInt(row['O/S INDENTS']) : null
              }).returning();
            })
          );
          results.push(...insertedBatch);
        } catch (error) {
          console.error(`Error inserting batch starting at index ${i}:`, error);
        }
        console.log(`Processed ${Math.min(i + batchSize, jsonData.length)}/${jsonData.length} records`);
      }

      res.json({
        success: true,
        message: `Successfully imported ${results.length} records`,
        totalProcessed: jsonData.length
      });
    } catch (error: any) {
      console.error("Error importing Excel file:", error);
      res.status(500).json({
        error: "Failed to import Excel file",
        details: error.message
      });
    }
  });

  // Add the new comparison endpoints after the existing railway operations endpoints

  // Yearly comparison endpoint - Fixed to use correct table structure
  app.get("/api/reports/yearly-comparison", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const result = await db.execute(sql`
        SELECT 
          EXTRACT(YEAR FROM p_date) as year,
          COUNT(*) as total_wagons,
          SUM(units) as total_units,
          SUM(tonnage) as total_tonnage,
          SUM(freight) as total_freight
        FROM railway_loading_operations 
        WHERE p_date IS NOT NULL
        GROUP BY EXTRACT(YEAR FROM p_date)
        ORDER BY year DESC
      `);

      const yearlyData = result.rows.map(row => ({
        year: row.year?.toString() || 'Unknown',
        totalWagons: Number(row.total_wagons) || 0,
        totalUnits: Number(row.total_units) || 0,
        totalTonnage: Number(row.total_tonnage) || 0,
        totalFreight: Number(row.total_freight) || 0
      }));

      res.json(yearlyData);
    } catch (error) {
      console.error("Error generating yearly comparison:", error);
      res.status(500).json({
        error: "Failed to generate yearly comparison",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Commodity comparison endpoint - Updated to use correct table structure
  app.get("/api/reports/commodity-comparison", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const result = await db.execute(sql`
        WITH yearly_totals AS (
          SELECT 
            EXTRACT(YEAR FROM p_date) as year,
            COUNT(*) as year_total_wagons,
            SUM(units) as year_total_units,
            SUM(tonnage) as year_total_tonnage,
            SUM(freight) as year_total_freight
          FROM railway_loading_operations 
          WHERE p_date IS NOT NULL
          GROUP BY EXTRACT(YEAR FROM p_date)
        ),
        commodity_data AS (
          SELECT 
            EXTRACT(YEAR FROM p_date) as year,
            commodity as commodity,
            COUNT(*) as total_wagons,
            SUM(units) as total_units,
            SUM(tonnage) as total_tonnage,
            SUM(freight) as total_freight,
            COUNT(*) as record_count
          FROM railway_loading_operations 
          WHERE p_date IS NOT NULL
            AND commodity IS NOT NULL
            AND commodity != ''
          GROUP BY EXTRACT(YEAR FROM p_date), commodity
        )
        SELECT 
          cd.*,
          ROUND((cd.total_wagons::decimal / NULLIF(yt.year_total_wagons, 0)) * 100, 2) as wagons_percentage,
          ROUND((cd.total_units::decimal / NULLIF(yt.year_total_units, 0)) * 100, 2) as units_percentage,
          ROUND((cd.total_tonnage::decimal / NULLIF(yt.year_total_tonnage, 0)) * 100, 2) as tonnage_percentage,
          ROUND((cd.total_freight::decimal / NULLIF(yt.year_total_freight, 0)) * 100, 2) as freight_percentage
        FROM commodity_data cd
        JOIN yearly_totals yt ON cd.year = yt.year
        ORDER BY cd.year DESC, cd.total_wagons DESC
      `);

      // Group by year and add station data for each commodity
      const commodityDataByYear = result.rows.reduce((acc, row) => {
        const year = row.year?.toString() || 'Unknown';
        if (!acc[year]) {
          acc[year] = [];
        }
        acc[year].push({
          commodity: row.commodity || 'Unknown',
          totalWagons: Number(row.total_wagons) || 0,
          totalUnits: Number(row.total_units) || 0,
          totalTonnage: Number(row.total_tonnage) || 0,
          totalFreight: Number(row.total_freight) || 0,
          recordCount: Number(row.record_count) || 0,
          wagonsPercentage: Number(row.wagons_percentage) || 0,
          unitsPercentage: Number(row.units_percentage) || 0,
          tonnagePercentage: Number(row.tonnage_percentage) || 0,
          freightPercentage: Number(row.freight_percentage) || 0
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Get station data for each commodity
      for (const [year, commodities] of Object.entries(commodityDataByYear)) {
        for (const commodity of commodities) {
          const stationResult = await db.execute(sql`
            SELECT 
              station,
              COUNT(*) as total_wagons,
              SUM(units) as total_units,
              SUM(tonnage) as total_tonnage,
              SUM(freight) as total_freight
            FROM railway_loading_operations 
            WHERE EXTRACT(YEAR FROM p_date) = ${year}
              AND commodity = ${commodity.commodity}
              AND station IS NOT NULL
              AND station != ''
            GROUP BY station
            ORDER BY total_wagons DESC
          `);

          // Calculate percentages in JavaScript to avoid SQL type issues
          const stationData = stationResult.rows.map(station => {
            const totalWagons = Number(station.total_wagons) || 0;
            const totalUnits = Number(station.total_units) || 0;
            const totalTonnage = Number(station.total_tonnage) || 0;
            const totalFreight = Number(station.total_freight) || 0;
            
            const wagonsPercentage = commodity.totalWagons > 0 ? 
              Math.round((totalWagons / commodity.totalWagons) * 100 * 100) / 100 : 0;
            const unitsPercentage = commodity.totalUnits > 0 ? 
              Math.round((totalUnits / commodity.totalUnits) * 100 * 100) / 100 : 0;
            const tonnagePercentage = commodity.totalTonnage > 0 ? 
              Math.round((totalTonnage / commodity.totalTonnage) * 100 * 100) / 100 : 0;
            const freightPercentage = commodity.totalFreight > 0 ? 
              Math.round((totalFreight / commodity.totalFreight) * 100 * 100) / 100 : 0;

            return {
              station: station.station || 'Unknown',
              total_wagons: totalWagons,
              total_units: totalUnits,
              total_tonnage: totalTonnage,
              total_freight: totalFreight,
              wagons_percentage: wagonsPercentage,
              units_percentage: unitsPercentage,
              tonnage_percentage: tonnagePercentage,
              freight_percentage: freightPercentage
            };
          });

          commodity.stations = stationData.map(station => ({
            station: station.station,
            totalWagons: station.total_wagons,
            totalUnits: station.total_units,
            totalTonnage: station.total_tonnage,
            totalFreight: station.total_freight,
            wagonsPercentage: station.wagons_percentage,
            unitsPercentage: station.units_percentage,
            tonnagePercentage: station.tonnage_percentage,
            freightPercentage: station.freight_percentage
          }));
        }
      }

      // Convert to array format expected by frontend
      const commodityData = Object.entries(commodityDataByYear).map(([year, data]) => ({
        year,
        data
      }));

      res.json(commodityData);
    } catch (error) {
      console.error("Error generating commodity comparison:", error);
      res.status(500).json({
        error: "Failed to generate commodity comparison",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Station comparison endpoint - Updated to use correct table structure
  app.get("/api/reports/station-comparison", async (req, res) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).send("Not authenticated");
      }

      const { commodity } = req.query;

      let baseQuery = sql`
        WITH yearly_totals AS (
          SELECT 
            EXTRACT(YEAR FROM p_date) as year,
            COUNT(*) as year_total_wagons,
            SUM(units) as year_total_units,
            SUM(tonnage) as year_total_tonnage,
            SUM(freight) as year_total_freight
          FROM railway_loading_operations 
          WHERE p_date IS NOT NULL
      `;

      if (commodity && commodity !== 'all') {
        baseQuery = sql`${baseQuery} AND commodity = ${commodity}`;
      }

      baseQuery = sql`${baseQuery}
          GROUP BY EXTRACT(YEAR FROM p_date)
        ),
        station_data AS (
          SELECT 
            EXTRACT(YEAR FROM p_date) as year,
            commodity as commodity,
            station as station,
            COUNT(*) as total_wagons,
            SUM(units) as total_units,
            SUM(tonnage) as total_tonnage,
            SUM(freight) as total_freight
          FROM railway_loading_operations 
          WHERE p_date IS NOT NULL
            AND station IS NOT NULL
            AND station != ''
      `;

      if (commodity && commodity !== 'all') {
        baseQuery = sql`${baseQuery} AND commodity = ${commodity}`;
      }

      baseQuery = sql`${baseQuery}
          GROUP BY EXTRACT(YEAR FROM p_date), commodity, station
        )
        SELECT 
          sd.*,
          ROUND((sd.total_wagons::decimal / NULLIF(yt.year_total_wagons, 0)) * 100, 2) as wagons_percentage,
          ROUND((sd.total_units::decimal / NULLIF(yt.year_total_units, 0)) * 100, 2) as units_percentage,
          ROUND((sd.total_tonnage::decimal / NULLIF(yt.year_total_tonnage, 0)) * 100, 2) as tonnage_percentage,
          ROUND((sd.total_freight::decimal / NULLIF(yt.year_total_freight, 0)) * 100, 2) as freight_percentage
        FROM station_data sd
        JOIN yearly_totals yt ON sd.year = yt.year
        ORDER BY sd.year DESC, sd.commodity, sd.total_wagons DESC
      `;

      const result = await db.execute(baseQuery);

      // Group by year and commodity
      const stationDataByYear = result.rows.reduce((acc, row) => {
        const year = row.year?.toString() || 'Unknown';
        const commodityName = row.commodity || 'Unknown';
        
        if (!acc[year]) {
          acc[year] = {};
        }
        if (!acc[year][commodityName]) {
          acc[year][commodityName] = {
            commodity: commodityName,
            stations: []
          };
        }
        
        acc[year][commodityName].stations.push({
          station: row.station || 'Unknown',
          totalWagons: Number(row.total_wagons) || 0,
          totalUnits: Number(row.total_units) || 0,
          totalTonnage: Number(row.total_tonnage) || 0,
          totalFreight: Number(row.total_freight) || 0,
          wagonsPercentage: Number(row.wagons_percentage) || 0,
          unitsPercentage: Number(row.units_percentage) || 0,
          tonnagePercentage: Number(row.tonnage_percentage) || 0,
          freightPercentage: Number(row.freight_percentage) || 0
        });
        
        return acc;
      }, {} as Record<string, Record<string, any>>);

      // Convert to array format expected by frontend
      const stationData = Object.entries(stationDataByYear).map(([year, commodities]) => ({
        year,
        data: Object.values(commodities)
      }));

      res.json(stationData);
    } catch (error) {
      console.error("Error generating station comparison:", error);
      res.status(500).json({
        error: "Failed to generate station comparison",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Station-wise comparative loading data endpoint (same period as commodity comparative)
  app.get("/api/station-comparative-loading", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    
    try {
      // Use exact same logic as commodity comparative endpoint
      const today = new Date();
      const currentYear = today.getFullYear();
      const previousYear = currentYear - 1;
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      let currentPeriodStart: Date;
      let currentPeriodEnd: Date;
      
      // Same weekly pattern as commodity comparative:
      // - On Monday: show previous week (Monday to Sunday)
      // - On Tuesday-Sunday: show current week Monday to previous day
      if (currentDay === 1) { // Monday
        // Show previous week (Monday to Sunday)
        currentPeriodStart = new Date(today);
        currentPeriodStart.setDate(today.getDate() - 7); // Previous Monday
        currentPeriodStart.setHours(0, 0, 0, 0);
        
        currentPeriodEnd = new Date(today);
        currentPeriodEnd.setDate(today.getDate() - 1); // Previous Sunday
        currentPeriodEnd.setHours(23, 59, 59, 999);
      } else {
        // Show current week Monday to previous day
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        currentPeriodStart = new Date(today);
        currentPeriodStart.setDate(today.getDate() + mondayOffset);
        currentPeriodStart.setHours(0, 0, 0, 0);
        
        currentPeriodEnd = new Date(today);
        currentPeriodEnd.setDate(today.getDate() - 1); // Previous day
        currentPeriodEnd.setHours(23, 59, 59, 999);
      }
      
      // Calculate the same period in previous year
      const previousPeriodStart = new Date(previousYear, currentPeriodStart.getMonth(), currentPeriodStart.getDate());
      const previousPeriodEnd = new Date(previousYear, currentPeriodEnd.getMonth(), currentPeriodEnd.getDate());

      // Format dates for period labels (same as commodity comparative)
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        }).replace(/\//g, '-');
      };
      
      const currentPeriodStartFormatted = formatDate(currentPeriodStart);
      const currentPeriodEndFormatted = formatDate(currentPeriodEnd);
      const previousPeriodStartFormatted = formatDate(previousPeriodStart);
      const previousPeriodEndFormatted = formatDate(previousPeriodEnd);

      // Fetch current period data
      const currentData = await db.select()
        .from(railwayLoadingOperations)
        .where(and(
          gte(railwayLoadingOperations.pDate, currentPeriodStart),
          lte(railwayLoadingOperations.pDate, currentPeriodEnd)
        ));

      // Fetch previous period data
      const previousData = await db.select()
        .from(railwayLoadingOperations)
        .where(and(
          gte(railwayLoadingOperations.pDate, previousPeriodStart),
          lte(railwayLoadingOperations.pDate, previousPeriodEnd)
        ));

      // Calculate days in period
      const currentDays = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      const previousDays = Math.ceil((previousPeriodEnd.getTime() - previousPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1; // May 26-31 = 6 days

      const stationComparison = generateStationComparison(currentData, previousData, currentDays, previousDays);

      const responseData = {
        periods: {
          current: `${currentPeriodStartFormatted} to ${currentPeriodEndFormatted}`,
          previous: `${previousPeriodStartFormatted} to ${previousPeriodEndFormatted}`
        },
        data: stationComparison.sort((a, b) => b.currentMT - a.currentMT),
        totals: stationComparison.reduce((acc, item) => ({
          currentPeriod: {
            rks: acc.currentPeriod.rks + item.currentRks,
            wagons: acc.currentPeriod.wagons + item.currentWagon,
            tonnage: acc.currentPeriod.tonnage + item.currentMT,
            freight: acc.currentPeriod.freight + item.currentFreight,
            avgPerDay: 0 // Will be calculated after reduce
          },
          previousPeriod: {
            rks: acc.previousPeriod.rks + item.compareRks,
            wagons: acc.previousPeriod.wagons + item.compareWagon,
            tonnage: acc.previousPeriod.tonnage + item.compareMT,
            freight: acc.previousPeriod.freight + item.compareFreight,
            avgPerDay: 0 // Will be calculated after reduce
          }
        }), {
          currentPeriod: { rks: 0, wagons: 0, tonnage: 0, freight: 0, avgPerDay: 0 },
          previousPeriod: { rks: 0, wagons: 0, tonnage: 0, freight: 0, avgPerDay: 0 }
        })
      };

      // Calculate avgPerDay for totals
      responseData.totals.currentPeriod.avgPerDay = responseData.totals.currentPeriod.rks / currentDays;
      responseData.totals.previousPeriod.avgPerDay = responseData.totals.previousPeriod.rks / previousDays;

      res.json(responseData);
    } catch (error: any) {
      console.error("Error fetching station comparative loading data:", error);
      res.status(500).json({
        error: "Failed to fetch station comparative loading data",
        details: error.message
      });
    }
  });

  // Weekly comparative loading data endpoint
  app.get("/api/comparative-loading", async (req, res) => {
    // Check if user is authenticated
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    try {
      // Calculate weekly comparison with specific date pattern as requested
      const today = new Date();
      const currentYear = today.getFullYear(); // 2025
      const previousYear = currentYear - 1; // 2024
      const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
      
      let currentPeriodStart: Date;
      let currentPeriodEnd: Date;
      
      // Implement the specific weekly pattern:
      // - On Monday: show previous week (Monday to Sunday)
      // - On Tuesday-Sunday: show current week Monday to previous day
      if (currentDay === 1) { // Monday
        // Show previous week (Monday to Sunday)
        currentPeriodStart = new Date(today);
        currentPeriodStart.setDate(today.getDate() - 7); // Previous Monday
        currentPeriodStart.setHours(0, 0, 0, 0);
        
        currentPeriodEnd = new Date(today);
        currentPeriodEnd.setDate(today.getDate() - 1); // Previous Sunday
        currentPeriodEnd.setHours(23, 59, 59, 999);
      } else {
        // Show current week Monday to previous day
        const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
        currentPeriodStart = new Date(today);
        currentPeriodStart.setDate(today.getDate() + mondayOffset);
        currentPeriodStart.setHours(0, 0, 0, 0);
        
        currentPeriodEnd = new Date(today);
        currentPeriodEnd.setDate(today.getDate() - 1); // Previous day
        currentPeriodEnd.setHours(23, 59, 59, 999);
      }
      
      // Calculate the same period in previous year
      const previousPeriodStart = new Date(previousYear, currentPeriodStart.getMonth(), currentPeriodStart.getDate());
      const previousPeriodEnd = new Date(previousYear, currentPeriodEnd.getMonth(), currentPeriodEnd.getDate());
      
      // Format dates for period labels
      const formatDate = (date: Date) => {
        return date.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: '2-digit', 
          year: 'numeric'
        }).replace(/\//g, '-');
      };
      
      const currentPeriodStartFormatted = formatDate(currentPeriodStart);
      const currentPeriodEndFormatted = formatDate(currentPeriodEnd);
      const previousPeriodStartFormatted = formatDate(previousPeriodStart);
      const previousPeriodEndFormatted = formatDate(previousPeriodEnd);
      
      // Fetch current period data (based on weekly pattern)
      const currentPeriodData = await db.execute(sql`
        SELECT 
          commodity,
          COUNT(*) as rks,
          SUM(wagons) as total_wagons,
          SUM(units) as total_units,
          SUM(tonnage) as total_tonnage,
          SUM(freight) as total_freight
        FROM railway_loading_operations 
        WHERE p_date >= ${currentPeriodStart.toISOString().split('T')[0]}
          AND p_date <= ${currentPeriodEnd.toISOString().split('T')[0]}
          AND commodity IS NOT NULL
          AND commodity != ''
        GROUP BY commodity
        ORDER BY total_tonnage DESC
      `);
      
      // Fetch previous period data (same period in previous year)
      const previousPeriodData = await db.execute(sql`
        SELECT 
          commodity,
          COUNT(*) as rks,
          SUM(wagons) as total_wagons,
          SUM(units) as total_units,
          SUM(tonnage) as total_tonnage,
          SUM(freight) as total_freight
        FROM railway_loading_operations 
        WHERE p_date >= ${previousPeriodStart.toISOString().split('T')[0]}
          AND p_date <= ${previousPeriodEnd.toISOString().split('T')[0]}
          AND commodity IS NOT NULL
          AND commodity != ''
        GROUP BY commodity
      `);
      
      // Process and combine data
      const currentMap = new Map();
      currentPeriodData.rows.forEach(row => {
        const daysInCurrentPeriod = Math.ceil((currentPeriodEnd.getTime() - currentPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        const avgPerDay = daysInCurrentPeriod > 0 ? (Number(row.rks) || 0) / daysInCurrentPeriod : 0;
        currentMap.set(row.commodity, {
          commodity: row.commodity,
          rks: Number(row.rks) || 0,
          avgPerDay: Number(avgPerDay.toFixed(2)),
          wagons: Number(row.total_wagons) || 0,
          tonnage: Number(row.total_tonnage) || 0,
          freight: Number(row.total_freight) || 0
        });
      });
      
      const previousMap = new Map();
      previousPeriodData.rows.forEach(row => {
        const daysInPreviousPeriod = Math.ceil((previousPeriodEnd.getTime() - previousPeriodStart.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        const avgPerDay = daysInPreviousPeriod > 0 ? (Number(row.rks) || 0) / daysInPreviousPeriod : 0;
        previousMap.set(row.commodity, {
          commodity: row.commodity,
          rks: Number(row.rks) || 0,
          avgPerDay: Number(avgPerDay.toFixed(2)),
          wagons: Number(row.total_wagons) || 0,
          tonnage: Number(row.total_tonnage) || 0,
          freight: Number(row.total_freight) || 0
        });
      });
      
      // Combine all commodities
      const allCommodities = new Set([...Array.from(currentMap.keys()), ...Array.from(previousMap.keys())]);
      
      const comparativeData = Array.from(allCommodities).map(commodity => {
        const current = currentMap.get(commodity) || { 
          commodity, rks: 0, avgPerDay: 0, wagons: 0, tonnage: 0, freight: 0 
        };
        const previous = previousMap.get(commodity) || { 
          commodity, rks: 0, avgPerDay: 0, wagons: 0, tonnage: 0, freight: 0 
        };
        
        const changeInMT = current.tonnage - previous.tonnage;
        const changeInPercentage = previous.tonnage > 0 ? 
          Math.round((changeInMT / previous.tonnage) * 100 * 100) / 100 : 
          (current.tonnage > 0 ? 100 : 0);
        
        return {
          commodity,
          currentPeriod: current,
          previousPeriod: previous,
          changeInMT: Math.round(changeInMT * 100) / 100,
          changeInPercentage: Math.round(changeInPercentage * 100) / 100
        };
      });
      
      // Calculate totals
      const totalCurrent = comparativeData.reduce((acc, item) => ({
        rks: acc.rks + item.currentPeriod.rks,
        avgPerDay: acc.avgPerDay + item.currentPeriod.avgPerDay,
        wagons: acc.wagons + item.currentPeriod.wagons,
        tonnage: acc.tonnage + item.currentPeriod.tonnage,
        freight: acc.freight + item.currentPeriod.freight
      }), { rks: 0, avgPerDay: 0, wagons: 0, tonnage: 0, freight: 0 });
      
      const totalPrevious = comparativeData.reduce((acc, item) => ({
        rks: acc.rks + item.previousPeriod.rks,
        avgPerDay: acc.avgPerDay + item.previousPeriod.avgPerDay,
        wagons: acc.wagons + item.previousPeriod.wagons,
        tonnage: acc.tonnage + item.previousPeriod.tonnage,
        freight: acc.freight + item.previousPeriod.freight
      }), { rks: 0, avgPerDay: 0, wagons: 0, tonnage: 0, freight: 0 });
      
      const totalChangeInMT = totalCurrent.tonnage - totalPrevious.tonnage;
      const totalChangeInPercentage = totalPrevious.tonnage > 0 ? 
        Math.round((totalChangeInMT / totalPrevious.tonnage) * 100 * 100) / 100 : 
        (totalCurrent.tonnage > 0 ? 100 : 0);
      
      res.json({
        periods: {
          current: `${currentPeriodStartFormatted} to ${currentPeriodEndFormatted}`,
          previous: `${previousPeriodStartFormatted} to ${previousPeriodEndFormatted}`
        },
        data: comparativeData.sort((a, b) => b.currentPeriod.tonnage - a.currentPeriod.tonnage),
        totals: {
          commodity: 'TOTAL',
          currentPeriod: {
            ...totalCurrent,
            avgPerDay: Math.round(totalCurrent.avgPerDay * 100) / 100
          },
          previousPeriod: {
            ...totalPrevious,
            avgPerDay: Math.round(totalPrevious.avgPerDay * 100) / 100
          },
          changeInMT: Math.round(totalChangeInMT * 100) / 100,
          changeInPercentage: Math.round(totalChangeInPercentage * 100) / 100
        }
      });
      
    } catch (error) {
      console.error("Error generating comparative loading data:", error);
      res.status(500).json({
        error: "Failed to generate comparative loading data",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Yearly commodity loading data endpoint for charts
  app.get("/api/yearly-loading-commodities", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    try {
      // Fetch yearly commodity data grouped by year and commodity
      const yearlyData = await db.execute(sql`
        SELECT 
          EXTRACT(YEAR FROM p_date) as year,
          commodity,
          SUM(tonnage) as total_tonnage,
          SUM(wagons) as total_wagons,
          SUM(freight) as total_freight
        FROM railway_loading_operations 
        WHERE commodity IS NOT NULL 
          AND commodity != ''
          AND tonnage > 0
        GROUP BY EXTRACT(YEAR FROM p_date), commodity
        ORDER BY year DESC, total_tonnage DESC
      `);

      // Transform data for chart consumption
      const formattedData = yearlyData.rows.map(row => ({
        year: String(row.year),
        commodity: String(row.commodity),
        totalTonnage: Number(row.total_tonnage) || 0,
        totalWagons: Number(row.total_wagons) || 0,
        totalFreight: Number(row.total_freight) || 0
      }));

      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching yearly commodity data:", error);
      res.status(500).json({
        error: "Failed to fetch yearly commodity data",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Yearly station loading data endpoint for charts
  app.get("/api/yearly-loading-stations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }
    try {
      // Fetch yearly station data grouped by year and station
      const yearlyData = await db.execute(sql`
        SELECT 
          EXTRACT(YEAR FROM p_date) as year,
          station,
          SUM(tonnage) as total_tonnage,
          SUM(wagons) as total_wagons,
          SUM(freight) as total_freight
        FROM railway_loading_operations 
        WHERE station IS NOT NULL 
          AND station != ''
          AND tonnage > 0
        GROUP BY EXTRACT(YEAR FROM p_date), station
        ORDER BY year DESC, total_tonnage DESC
      `);

      // Transform data for chart consumption
      const formattedData = yearlyData.rows.map(row => ({
        year: String(row.year),
        station: String(row.station),
        totalTonnage: Number(row.total_tonnage) || 0,
        totalWagons: Number(row.total_wagons) || 0,
        totalFreight: Number(row.total_freight) || 0
      }));

      res.json(formattedData);
    } catch (error) {
      console.error("Error fetching yearly station data:", error);
      res.status(500).json({
        error: "Failed to fetch yearly station data",
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Users management endpoints
  app.get("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const user = req.user as any;
    if (!user?.isAdmin) {
      return res.status(403).send("Access denied. Admin privileges required.");
    }

    try {
      const allUsers = await db
        .select({
          id: users.id,
          username: users.username,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        })
        .from(users)
        .orderBy(desc(users.createdAt));

      res.json(allUsers);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.post("/api/users", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const user = req.user as any;
    if (!user?.isAdmin) {
      return res.status(403).send("Access denied. Admin privileges required.");
    }

    try {
      const { username, password, isAdmin } = req.body;

      if (!username || !password) {
        return res.status(400).json({ error: "Username and password are required" });
      }

      if (password.length < 6) {
        return res.status(400).json({ error: "Password must be at least 6 characters" });
      }

      // Check if user already exists
      const existingUser = await db.select().from(users).where(eq(users.username, username)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: "User already exists" });
      }

      // Use the same crypto system as auth.ts
      const { scrypt, randomBytes } = await import("crypto");
      const { promisify } = await import("util");
      const scryptAsync = promisify(scrypt);
      
      const salt = randomBytes(16).toString("hex");
      const buf = (await scryptAsync(password, salt, 64)) as Buffer;
      const hashedPassword = `${buf.toString("hex")}.${salt}`;

      const [newUser] = await db
        .insert(users)
        .values({
          username,
          password: hashedPassword,
          isAdmin: Boolean(isAdmin),
        })
        .returning({
          id: users.id,
          username: users.username,
          isAdmin: users.isAdmin,
          createdAt: users.createdAt,
        });

      res.json(newUser);
    } catch (error) {
      console.error("Error creating user:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });

  app.delete("/api/users/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).send("Not authenticated");
    }

    const user = req.user as any;
    if (!user?.isAdmin) {
      return res.status(403).send("Access denied. Admin privileges required.");
    }

    try {
      const { id } = req.params;
      const userId = parseInt(id);

      // Prevent deleting self
      if (userId === user.id) {
        return res.status(400).json({ error: "Cannot delete your own account" });
      }

      const [deletedUser] = await db
        .delete(users)
        .where(eq(users.id, userId))
        .returning();

      if (!deletedUser) {
        return res.status(404).json({ error: "User not found" });
      }

      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Helper functions for daily reports
function generateCommodityComparison(currentData: any[], compareData: any[], currentDays: number, compareDays: number) {
  // Group data by commodity
  const currentGrouped = groupByField(currentData, 'commodity');
  const compareGrouped = groupByField(compareData, 'commodity');
  
  // Get all unique commodities
  const allCommodities = new Set([...Object.keys(currentGrouped), ...Object.keys(compareGrouped)]);
  
  return Array.from(allCommodities).map(commodity => {
    const currentRows = currentGrouped[commodity] || [];
    const compareRows = compareGrouped[commodity] || [];
    
    const currentStats = calculateStats(currentRows);
    const compareStats = calculateStats(compareRows);
    
    const currentAvgDay = currentDays > 0 ? (currentStats.rks / currentDays) : 0;
    const compareAvgDay = compareDays > 0 ? (compareStats.rks / compareDays) : 0;
    
    const variationUnits = currentStats.mt - compareStats.mt;
    const variationPercent = compareStats.mt > 0 ? ((variationUnits / compareStats.mt) * 100) : 0;
    
    return {
      commodity,
      currentRks: currentStats.rks,
      currentAvgDay: Number(currentAvgDay.toFixed(2)),
      currentWagon: currentStats.wagons,
      currentMT: Number(currentStats.mt.toFixed(3)),
      currentFreight: Number(currentStats.freight.toFixed(2)),
      compareRks: compareStats.rks,
      compareAvgDay: Number(compareAvgDay.toFixed(2)),
      compareWagon: compareStats.wagons,
      compareMT: Number(compareStats.mt.toFixed(3)),
      compareFreight: Number(compareStats.freight.toFixed(2)),
      variationUnits: Number(variationUnits.toFixed(3)),
      variationPercent: Number(variationPercent.toFixed(2))
    };
  });
}

function generateStationComparison(currentData: any[], compareData: any[], currentDays: number, compareDays: number) {
  // Group data by station
  const currentGrouped = groupByField(currentData, 'station');
  const compareGrouped = groupByField(compareData, 'station');
  
  // Get all unique stations
  const allStations = new Set([...Object.keys(currentGrouped), ...Object.keys(compareGrouped)]);
  
  return Array.from(allStations).map(station => {
    const currentRows = currentGrouped[station] || [];
    const compareRows = compareGrouped[station] || [];
    
    const currentStats = calculateStats(currentRows);
    const compareStats = calculateStats(compareRows);
    
    const currentAvgDay = currentDays > 0 ? (currentStats.rks / currentDays) : 0;
    const compareAvgDay = compareDays > 0 ? (compareStats.rks / compareDays) : 0;
    
    const variationUnits = currentStats.mt - compareStats.mt;
    const variationPercent = compareStats.mt > 0 ? ((variationUnits / compareStats.mt) * 100) : 0;
    
    return {
      station,
      currentRks: currentStats.rks,
      currentAvgPerDay: Number(currentAvgDay.toFixed(2)),
      currentWagon: currentStats.wagons,
      currentMT: Number(currentStats.mt.toFixed(3)),
      currentFreight: Number(currentStats.freight.toFixed(2)),
      compareRks: compareStats.rks,
      compareAvgPerDay: Number(compareAvgDay.toFixed(2)),
      compareWagon: compareStats.wagons,
      compareMT: Number(compareStats.mt.toFixed(3)),
      compareFreight: Number(compareStats.freight.toFixed(2)),
      variationUnits: Number(variationUnits.toFixed(3)),
      variationPercent: Number(variationPercent.toFixed(2))
    };
  });
}

function groupByField(data: any[], field: string) {
  return data.reduce((acc, row) => {
    const key = row[field] || 'Unknown';
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
}

function calculateStats(rows: any[]) {
  return rows.reduce((acc, row) => {
    acc.rks += 1;
    acc.wagons += Number(row.wagons) || 0;
    acc.mt += Number(row.tonnage) || 0;
    acc.freight += Number(row.freight) || 0;
    return acc;
  }, { rks: 0, wagons: 0, mt: 0, freight: 0 });
}

function generateDailyReportPDF(doc: typeof PDFDocument, currentData: any[], compareData: any[], currentFrom: Date, currentTo: Date, compareFrom: Date, compareTo: Date, currentDays: number, compareDays: number) {
  // Title
  doc.fontSize(16).text('Comparative Loading Particulars', { align: 'center' });
  doc.fontSize(12).text(`${formatDate(currentFrom, 'dd-MM-yyyy')} to ${formatDate(currentTo, 'dd-MM-yyyy')} vs ${formatDate(compareFrom, 'dd-MM-yyyy')} to ${formatDate(compareTo, 'dd-MM-yyyy')}`, { align: 'center' });
  doc.moveDown(2);
  
  // Commodity-wise section
  doc.fontSize(14).text('Commodity wise Comparative Loading Particulars');
  doc.moveDown();
  
  const commodityData = generateCommodityComparison(currentData, compareData, currentDays, compareDays);
  
  // Table headers
  doc.fontSize(8);
  let y = doc.y;
  const commodityHeaders = ['Commodity', 'Rks', 'Avg/Day', 'Wagon', 'MT', 'Freight', 'Rks', 'Avg/Day', 'Wagon', 'MT', 'Freight', 'Var Units', 'Var %'];
  
  commodityHeaders.forEach((header, i) => {
    doc.text(header, 50 + (i * 35), y, { width: 30 });
  });
  
  y += 15;
  commodityData.forEach((row) => {
    doc.text(row.commodity, 50, y, { width: 30 });
    doc.text(row.currentRks.toString(), 85, y, { width: 30 });
    doc.text(row.currentAvgPerDay.toString(), 120, y, { width: 30 });
    doc.text(row.currentWagon.toString(), 155, y, { width: 30 });
    doc.text(row.currentMT.toString(), 190, y, { width: 30 });
    doc.text(row.currentFreight.toString(), 225, y, { width: 30 });
    doc.text(row.compareRks.toString(), 260, y, { width: 30 });
    doc.text(row.compareAvgPerDay.toString(), 295, y, { width: 30 });
    doc.text(row.compareWagon.toString(), 330, y, { width: 30 });
    doc.text(row.compareMT.toString(), 365, y, { width: 30 });
    doc.text(row.compareFreight.toString(), 400, y, { width: 30 });
    doc.text(row.variationUnits.toString(), 435, y, { width: 30 });
    doc.text(`${row.variationPercent}%`, 470, y, { width: 30 });
    y += 12;
  });
  
  // Add new page for station data
  doc.addPage();
  doc.fontSize(14).text('Station wise Comparative Loading Particulars');
  doc.moveDown();
  
  const stationData = generateStationComparison(currentData, compareData, currentDays, compareDays);
  
  // Station table
  doc.fontSize(8);
  y = doc.y;
  const stationHeaders = ['Station', 'Rks', 'Avg/Day', 'Wagon', 'MT', 'Freight', 'Rks', 'Avg/Day', 'Wagon', 'MT', 'Freight', 'Var Units', 'Var %'];
  
  stationHeaders.forEach((header, i) => {
    doc.text(header, 50 + (i * 35), y, { width: 30 });
  });
  
  y += 15;
  stationData.forEach((row) => {
    doc.text(row.station, 50, y, { width: 30 });
    doc.text(row.currentRks.toString(), 85, y, { width: 30 });
    doc.text(row.currentAvgPerDay.toString(), 120, y, { width: 30 });
    doc.text(row.currentWagon.toString(), 155, y, { width: 30 });
    doc.text(row.currentMT.toString(), 190, y, { width: 30 });
    doc.text(row.currentFreight.toString(), 225, y, { width: 30 });
    doc.text(row.compareRks.toString(), 260, y, { width: 30 });
    doc.text(row.compareAvgPerDay.toString(), 295, y, { width: 30 });
    doc.text(row.compareWagon.toString(), 330, y, { width: 30 });
    doc.text(row.compareMT.toString(), 365, y, { width: 30 });
    doc.text(row.compareFreight.toString(), 400, y, { width: 30 });
    doc.text(row.variationUnits.toString(), 435, y, { width: 30 });
    doc.text(`${row.variationPercent}%`, 470, y, { width: 30 });
    y += 12;
  });
}