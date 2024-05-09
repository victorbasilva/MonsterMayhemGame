/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.monstermayhemgame;

/**
 *
 * @author Victor
 */
public class Ghost extends Monster {
    /**
 * Ghost class constructor.
 * @param row The ghost's starting row on the board.
 * @param col The ghost's starting column on the board.
 */
    public Ghost(int row, int col) {
        super(row, col); //Calls the constructor of the Monster superclass
    }
    
    /**
 * Method to move the ghost to a new position on the board.
 * @param newRow The new row to move the ghost.
 * @param newCol The new column to move the ghost to.
 */
    
    @Override
    public void move(int newRow, int newCol) {
        // Specific implementation for ghost movement
    }
    
    // Other ghost-specific methods if necessary
    
}
