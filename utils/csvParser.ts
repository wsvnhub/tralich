import Papa from 'papaparse';
import { ParsedResult } from '../types';

export const fetchAndParseCSV = async (url: string): Promise<string[][]> => {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    const csvText = await response.text();
    
    return new Promise((resolve, reject) => {
      Papa.parse(csvText, {
        complete: (results) => {
          resolve(results.data as string[][]);
        },
        error: (error: Error) => {
          reject(error);
        }
      });
    });
  } catch (error) {
    console.error("Error fetching/parsing CSV:", error);
    throw error;
  }
};

export const parseLocalCSV = (file: File): Promise<string[][]> => {
  return new Promise((resolve, reject) => {
    Papa.parse(file, {
      complete: (results) => {
        resolve(results.data as string[][]);
      },
      error: (error: Error) => {
        reject(error);
      }
    });
  });
};

// Helper to find non-empty header by looking left if current cell is empty (Merged cell logic)
const findHeaderValue = (grid: string[][], rowIdx: number, colIdx: number): string => {
  if (rowIdx < 0 || rowIdx >= grid.length) return '';
  
  // Look from current column backwards to 0
  for (let c = colIdx; c >= 0; c--) {
    const val = grid[rowIdx][c];
    if (val && val.trim() !== '') {
      return val.trim();
    }
  }
  return '';
};

export const searchInGrid = (grid: string[][], searchTerm: string): ParsedResult[] => {
  if (!searchTerm || searchTerm.trim() === '') return [];
  
  const results: ParsedResult[] = [];
  const term = searchTerm.trim().toLowerCase();
  
  // Global values
  // I = B1 -> Row 0, Col 1
  const I = grid.length > 0 && grid[0].length > 1 ? grid[0][1] : '';
  // J = B3 -> Row 2, Col 1
  const J = grid.length > 2 && grid[2].length > 1 ? grid[2][1] : '';

  // Iterate through the grid
  for (let r = 0; r < grid.length; r++) {
    const row = grid[r];
    for (let c = 0; c < row.length; c++) {
      const cellValue = row[c] ? row[c].toString() : '';
      
      if (cellValue.toLowerCase().includes(term)) {
        // Match found!
        
        // Extract components relative to match
        // B = Row 5 (index 5) - Header
        const B = grid.length > 5 ? (grid[5][c] || '') : '';
        // C = Row 4 (index 4) - Header
        const C = grid.length > 4 ? (grid[4][c] || '') : '';
        
        // D = Row + 1
        const D = grid.length > r + 1 ? (grid[r+1][c] || '') : '';
        // E = Col + 1
        const E = row.length > c + 1 ? (row[c+1] || '') : '';
        // F = Row + 2
        const F = grid.length > r + 2 ? (grid[r+2][c] || '') : '';
        // G = Row + 2, Col + 1
        const G = grid.length > r + 2 && grid[r+2].length > c + 1 ? (grid[r+2][c+1] || '') : '';
        // H = Row + 3
        const H = grid.length > r + 3 ? (grid[r+3][c] || '') : '';

        // Formatted string
        // Cú pháp kết quả: I - J - D - B (C) - E - Ca từ F đến G - H
        const formatted = `${I} - ${J} - ${D} - ${B} (${C}) - ${E} - Ca từ ${F} đến ${G} - ${H}`;

        results.push({
          raw: cellValue,
          formatted,
          components: { A: cellValue, B, C, D, E, F, G, H, I, J },
          coordinates: { row: r, col: c }
        });
      }
    }
  }
  return results;
};
