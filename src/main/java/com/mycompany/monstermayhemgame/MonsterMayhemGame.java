/*
 * Click nbfs://nbhost/SystemFileSystem/Templates/Licenses/license-default.txt to change this license
 */

package com.mycompany.monstermayhemgame;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Random;
import java.util.Scanner;

/**
 * Concurrent Systems - CA2
 * @author Victor - 2021259
 */
public class MonsterMayhemGame {
    private List<Player> players; // Players list
    private Board board; // Board game
    private int currentPlayerIndex; // Current player index
    private Random random; // Random number generator
    private Scanner scanner; // Scanner for user input
      
    /**
 * MonsterMayhemGame class constructor.
 * This builder is responsible for initializing the essential elements of the game.
 * This includes creating the player list, board instance,
 * setting the current player index, initializing the random number generator
 * and the creation of a Scanner for user input.
 */
    public MonsterMayhemGame() {
        players = new ArrayList<>(); // Initialize the player list
        board = new Board(); // Initialize the game board
        currentPlayerIndex = 0; // Set current player index to 0 (first player)
        random = new Random(); // Initialize the random number generator
        scanner = new Scanner(System.in); // Create a Scanner for user input  
    }
    
    /**
 * Method to start the game.
 */
    public void startGame() {
        
        initializePlayers(); // Initialize the players
        
        while (!isGameOver()) { // Main game loop
            Player currentPlayer = players.get(currentPlayerIndex); // Get the current player
            displayGameState(); // Displays the current state of the game (board, statistics, etc.)
            performPlayerTurn(currentPlayer); // Wait for the current player to make their move
            currentPlayerIndex = (currentPlayerIndex + 1) % players.size(); // Pass to the next player
        }
        displayGameResult(); // Displays the final result of the game
    }
    /**
 * Method to initialize game players.
 */
    private void initializePlayers() {
        System.out.println("Welcome to Monster Mayhem!");
        System.out.print("Enter the number of players: "); // Asks the user to enter the number of players
        int numPlayers = scanner.nextInt();
        
        scanner.nextLine(); // Clear the scanner buffer
        
        
        for (int i = 1; i <= numPlayers; i++) { // Create and add players to the player list
            System.out.print("Player name " + i + ": ");
            String playerName = scanner.nextLine();
            players.add(new Player(playerName));
        }
    }
    
    /**
 * Method to check if the game is over.
 * @return true if the game is over, false otherwise.
 */
    private boolean isGameOver() { // Checks if there is only one player left with less than 10 monsters
        long remainingPlayers = players.stream().filter(player -> player.getMonsters().size() < 10).count();
        return remainingPlayers == 1;
    }
    
    /**
 * Method to display the current state of the game.
 */
    private void displayGameState() {
        // Displays the current state of the board and statistics for each player
        // Part implemented according to user interface
    }
    
    /**
 * Method for taking a player's turn.
 * @param player The player taking the turn.
 */
    private void performPlayerTurn(Player player) {
        // Logic implemented for the player to make his move
    }
    
    /**
 * Method to display the final result of the game.
 */
    private void displayGameResult() {
        // Display game winner and final statistics
        // Part implemented according to user interface
    }
    
    /**
 * Main method to start the game.
 * @param args The command line arguments (not used in this game).
 */
    public static void main(String[] args) {
        MonsterMayhemGame game = new MonsterMayhemGame();
        game.startGame();
    }
    
    
}
