/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.monstermayhemgame;

/**
 *
 * @author Victor
 */
public class Werewolf extends Monster {
      /**
 * Werewolf class constructor.
 * @param row The werewolf's starting row on the board.
 * @param col The werewolf's starting column on the board.
 */
    public Werewolf(int row, int col) {
        super(row, col); //Calls the constructor of the Monster superclass
    }
    
    /**
 * Method to move the werewolf to a new position on the board.
 * @param newRow The new row to move the werewolf.
 * @param newCol The new column to move the werewolf to.
 */
    
    @Override
    public void move(int newRow, int newCol) {
        // Specific implementation for werewolf movement
    }
    
    // Other werewolf-specific methods if necessary
    
}
