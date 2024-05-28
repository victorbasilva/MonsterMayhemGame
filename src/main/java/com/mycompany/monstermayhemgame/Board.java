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
    private final int size = 10;
    private String[][] board;

    public Board() {
        board = new String[size][size];
        initializeBoard();
    }

    private void initializeBoard() {
        for (int i = 0; i < size; i++) {
            for (int j = 0; j < size; j++) {
                board[i][j] = ".";
            }
        }
    }

    public void printBoard() {
        System.out.print("   ");
        for (char c = 'A'; c < 'A' + size; c++) {
            System.out.print(c + " ");
        }
        System.out.println();

        for (int i = 0; i < size; i++) {
            System.out.printf("%2d ", i + 1);
            for (int j = 0; j < size; j++) {
                System.out.print(board[i][j] + " ");
            }
            System.out.println();
        }
    }

    public void setPiece(int row, int col, String piece) {
        if (row >= 0 && row < size && col >= 0 && col < size) {
            board[row][col] = piece;
        } else {
            System.out.println("Invalid position!");
        }
    }
}
