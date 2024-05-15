/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.monstermayhemgame;

/**
 *
 * @author Victor
 */
public class Board {
    private static final int SIZE = 10; // Board size (10x10)
    private Monster[][] grid; // Matrix to represent the board
    
    /**
 * Board class constructor. Initializes the board with empty cells.
 */
    public Board() {
        this.grid = new Monster[SIZE][SIZE]; // Initialize the board matrix
        // All cells start empty (no monsters)
    }
    
    /**
 * Method for placing a monster in a specific position on the board.
 * @param monster The monster to be placed.
 * @param row The row where the monster will be placed.
 * @param col The column where the monster will be placed.
 */
    public void placeMonster(Monster monster, int row, int col) {
        // Checks if the position is within the board limits
        if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
            grid[row][col] = monster; // Place the monster in the specified position
            monster.row = row; // Update the monster line
            monster.col = col; // Update monster column
    }else {
            System.out.println("Invalid position on the board.");
 }
 }
    
    /**
      * Method to remove a monster from a specific position on the board.
      * @param row The row from which the monster will be removed.
      * @param col The column the monster will be removed from.
      */
    public void removeMonster(int row, int col) {
        if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) {
            grid[row][col] = null; // Remove the monster from the specified position
            } else {
            System.out.println("Invalid position on the board.");
         }
     }
    
    
    /**
 * Method to check if a cell on the board is occupied by a monster.
 * @param row The row of the cell to check.
 * @param col The column of the cell to check.
 * @return true if the cell is busy, false otherwise.
 */
    public boolean isCellOccupied(int row, int col) {
        // Checks if the position is within the board limits
        if (row >= 0 && row < SIZE && col >= 0 && col < SIZE) { 
            return grid[row][col] != null; // Returns true if the cell is occupied by a monster
        }else {
            return false; // Returns false if the position is outside the board limits
        }
    }
    // Other methods for manipulating the board, such as moving monsters, checking for collisions, etc.
    
    public void displayBoard() {
        System.out.println("  0 1 2 3 4 5 6 7 8 9"); // Column header
        for (int row = 0; row < SIZE; row++) {
            System.out.print(row + " "); // Line header
            for (int col = 0; col < SIZE; col++) {
                if (grid[row][col] == null) {
                    System.out.print(". "); // Empty cell
                    } else if (grid[row][col] instanceof Vampire) {
                    System.out.print("V "); // Representation of the Vampire
                    } else if (grid[row][col] instanceof Werewolf) {
                    System.out.print("W "); // Representation of the Werewolf
                    } else if (grid[row][col] instanceof Ghost) {
                    System.out.print("G "); // Representation of the Ghost
                    }
            }
            System.out.println();
        }
    }
            
}
