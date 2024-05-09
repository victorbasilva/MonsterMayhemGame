/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.monstermayhemgame;

/**
 *
 * @author Victor
 */
public abstract class Monster {
    protected int row; // Monster's current row on the board
    protected int col; // Monster's current column on the board
    
    /**
 * Monster class constructor.
 * @param row The monster's starting row on the board.
 * @param col The monster's starting column on the board.
 */
    public Monster(int row, int col) {
        this.row = row; // Initialize the monster line
        this.col = col; // Initialize the monster column
        
        
    }
    
    /**
 * Abstract method to move the monster to a new position on the board.
 * @param newRow The new row to move the monster.
 * @param newCol The new column to move the monster to.
 */
    public abstract void move(int newRow, int newCol);
    
    // Other abstract methods for monster manipulation, like checking for collisions, etc.   
       
}
