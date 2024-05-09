/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 * Click nbfs://nbhost/SystemFileSystem/Templates/Classes/Class.java to edit this template
 */
package com.mycompany.monstermayhemgame;

import java.util.ArrayList;

/**
 *
 * @author Victor
 */
public class Player {
    
    private String name; //Name of the player
    private ArrayList<Monster> monsters; //Player's monster list
    private int wins; // Number of player wins
    private int losses; // Number of player losses
    
    /**
 * Constructor of the Player class.
 * @param name The name of the player.
 */
    
    public Player(String name) {
        this.name = name;
        this.monsters = new ArrayList<>(); // Initialize the empty monster list
        this.wins = 0; // Initialize the number of wins to 0
        this.losses = 0; // Initializes the number of defeats to 0
    }
    
    /**
 * Method for adding a monster to the player's monster list.
 * @param monster The monster to add.
 */
    public void addMonster(Monster monster) {
        monsters.add(monster);
    }
    
    /**
 * Method to remove a monster from the player's monster list.
 * @param monster The monster to remove.
 */
    public void removeMonster(Monster monster) {
        monsters.remove(monster);
    }
    
    /**
 * Method to get player name.
 * @return The player's name.
 */
    public String getName() {
        return name;
    }
    
    /**
 * Method to obtain the player's number of wins.
 * @return The player's number of wins.
 */
    public int getWins() {
        return wins;
    }
    
    /**
 * Method to obtain the player's number of defeats.
 * @return The player's number of defeats.
 */
    public int getLosses() {
        return losses;
    }
    
    // Methods for updating statistics, etc.
    
}
