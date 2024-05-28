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
    private String name;
    private int health;
    private int attackPower;

    public Monster(String name, int health, int attackPower) {
        this.name = name;
        this.health = health;
        this.attackPower = attackPower;
    }

    public String getName() {
        return name;
    }

    public int getHealth() {
        return health;
    }

    public void setHealth(int health) {
        this.health = health;
    }

    public int getAttackPower() {
        return attackPower;
    }

    public void attack(Monster target) {
        target.setHealth(target.getHealth() - this.attackPower);
    }

    @Override
    public String toString() {
        return String.format("%s [Health: %d, Attack Power: %d]", name, health, attackPower);
    }
}
