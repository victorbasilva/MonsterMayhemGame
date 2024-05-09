/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.monstermayhemgame;

/**
 *
 * @author Victor
 */
public class Vampire extends Monster {
     /**
 * Vampire class constructor.
 * @param row The vampire's starting row on the board.
 * @param col The vampire's starting column on the board.
 */
    public Vampire(int row, int col) {
        super(row, col); //Calls the constructor of the Monster superclass
    }
    
    /**
 * Method to move the vampire to a new position on the board.
 * @param newRow The new row to move the vampire.
 * @param newCol The new column to move the vampire to.
 */
    
    @Override
    public void move(int newRow, int newCol) {
        // Specific implementation for vampire movement
    }
    
    // Other vampire-specific methods if necessary
    
}
