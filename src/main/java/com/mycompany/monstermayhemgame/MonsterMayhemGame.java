/*
 * Changing IDE to VSCode
 */
package com.mycompany.monstermayhemgame;

/**
 *
 * @author Victor
 */

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

import java.util.Scanner;

import java.util.ArrayList;
import java.util.List;
import java.util.Scanner;

public class MonsterMayhemGame {
    private Board board;
    private List<Player> players;

    public MonsterMayhemGame() {
        board = new Board();
        players = new ArrayList<>();
    }

    private void setupPlayers() {
        Scanner scanner = new Scanner(System.in);
        System.out.println("Enter the names of the 4 players:");
        for (int i = 1; i <= 4; i++) {
            System.out.print("Player " + i + " name: ");
            String name = scanner.nextLine();
            players.add(new Player(name));
        }
    }

    public void startGame() {
        setupPlayers();
        board.printBoard();
        printPlayerNames();

        // Exemplo de criação e interação de monstros
        Monster vampire = new Vampire();
        Monster werewolf = new Werewolf();
        Monster ghost = new Ghost();

        System.out.println(vampire);
        System.out.println(werewolf);
        System.out.println(ghost);

        // Exemplo de combate
        vampire.attack(werewolf);
        System.out.println("After attack:");
        System.out.println(vampire);
        System.out.println(werewolf);
    }

    private void printPlayerNames() {
        System.out.println("Players in the game:");
        for (int i = 0; i < players.size(); i++) {
            System.out.println("Player " + (i + 1) + ": " + players.get(i).getName());
        }
    }

    public static void main(String[] args) {
        MonsterMayhemGame game = new MonsterMayhemGame();
        game.startGame();
    }
}
