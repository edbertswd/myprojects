package WizardTD;
import processing.core.PImage;
import processing.core.PApplet;

import java.util.ArrayList;

import static WizardTD.Constants.Direction.*;

public class Entities {
    private String entType;
    /**
     * Sets the speed
     */
    private int speed;

    /**
     * The Entity's hp
     */
    private float hp;
    /**
     * The Entity's x-coordinate.
     */
    private float x;

    /**
     * The Entity's y-coordinate.
     */
    private float y;

    /**
     * The Entity's PImage
     */
    private PImage sprite;

    private int lastDir;

    private int pathCounter;

    private int width;

    private int manaGained;
    private int armour;


    private ArrayList<Integer> opPath;

    /**
     * Creates a new Entity object
     *
     * @param x The x-coordinate.
     * @param y The y-coordinate.
     */
    public Entities(float x, float y, String entType, PImage sprite) {
        this.x = x;
        this.y = y;
        this.lastDir = -1;
        this.entType = entType;
        this.sprite = sprite;
        this.pathCounter = 0;
        this.opPath = new ArrayList<>();
        this.width = 32;
    }


    public void setDirection(int dir){
        this.lastDir = dir;
    }

    /**
     * Sets the entity's sprite
     * @param speed
     */
    public void setSpeed(int speed) {
        this.speed = speed;
    }

    public void opMove(int speed){
        if(pathCounter < opPath.size()){
            switch (opPath.get(pathCounter)) {
                case LEFT:
                    this.x -= speed;
                    break;
                case RIGHT:
                    this.x += speed;
                    break;
                case UP:
                    this.y -= speed;
                    break;
                case DOWN:
                    this.y += speed;
                    break;
            }
            pathCounter ++;
        }
    }

    public void setOpPath(ArrayList<Integer> op){
        for (int o : op){
            if (speed != 0) {
                for (int i = 0; i < (32 / speed); i++) {
                    this.opPath.add(o);
                }
            }

        }
    }

    public void setMana(int manaGained){
        this.manaGained = manaGained;
    }

    public void setArmour(int armour){
        this.armour = armour;
    }

    public int getPathCounter(){
        return this.pathCounter;
    }

    public int getLastDir(){
        return lastDir;
    }

    /**
     * Move the entity
     * @param speed
     * @param dir
     */
    public void move(float speed, int dir){
        switch (dir) {
            case LEFT:
                this.x -= speed;
                break;
            case RIGHT:
                this.x += speed;
                break;
            case UP:
                this.y -= speed;
                break;
            case DOWN:
                this.y += speed;
                break;
        }
    }



    /**
     * Sets the entity's sprite
     *
     * @param sprite The new sprite to use.
     */
    public void setSprite(PImage sprite) {
        this.sprite = sprite;
    }

    /**
     * Sets the entity's hp
     *
     * @param hp The entity's hp
     */
    public void setHp(float hp) {
        this.hp = hp;
    }

    /**
     * Updates the mob every frame.
     */
    public void update(){
        //Handles logic
        this.x += speed;
        this.y += speed;
    }


    /**
     * Draws the shape to the screen.
     *
     * @param app The window to draw onto.
     */
    public void draw(PApplet app) {
        // The image() method is used to draw PImages onto the screen.
        // The first argument is the image, the second and third arguments are coordinates
    }

    public float getHp(){
        return hp;
    }

    public PImage getSprite(){
        return this.sprite;
    }
    /**
     * Gets the x-coordinate.
     * @return The x-coordinate.
     */
    public float getX() {
        return this.x;
    }

    /**
     * Returns the y-coordinate.
     * @return The y-coordinate.
     */
    public float getY() {
        return this.y;
    }

    /**
     * Sets the x-coordinate.
     * @return The x-coordinate.
     */
    public void setX(float x){
        this.x = x;
    }

    /**
     * Sets the y-coordinate.
     * @return The y-coordinate.
     */
    public void setY(float y) {
        this.y = y;
    }
}

