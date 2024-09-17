package WizardTD;

import org.checkerframework.checker.units.qual.A;
import processing.core.PApplet;
import processing.core.PImage;

import java.lang.reflect.Array;
import java.util.*;
import static WizardTD.Constants.Direction.*;

public class EntitiesManager {
    private HashMap<String, PImage> imageFolder;
    private ArrayList<Entities> entFolder;
    private ArrayList<Tiles> tileList;

    private LinkedList<Tiles> junctionList;
    private String entType;

    private int x;
    private int y;

    private int speed;
    private ArrayList<Integer> wHouse;

    private ArrayList<Tiles> mapLoc;


    public EntitiesManager(){
        this.entFolder = new ArrayList<>();
    }

    public void setSpawn(int x, int y){
       this.x = x;
       this.y = y;
    }

    public void setMapLoc(ArrayList<Tiles> mapLoc){
        this.mapLoc = mapLoc;

    }
    public void setJunctionList(LinkedList<Tiles> junctionList){
        this.junctionList = junctionList;
    }
    public void setTileList(ArrayList<Tiles> tileList){
        this.tileList = tileList;
    }

    public void setImageFolder( HashMap<String, PImage> imageFolder){
        this.imageFolder = imageFolder;
    }





    public void setEntFolder(ArrayList<Entities> entFolder){
        this.entFolder = entFolder;
    }



    public void createEntity(String entType, float hp, int speed, int armour, int mana_gained_on_kill){
        Entities mob = new Entities(x, y, entType, imageFolder.get(entType));
        this.speed = speed;
        mob.setSpeed(speed);
        mob.setHp(hp);
        mob.setArmour(armour);
        mob.setMana(mana_gained_on_kill);
        this.entFolder.add(mob);
    }


    private float getSpeedX(int dir) {
        if (dir == LEFT) {
            return -speed;
        }
        else if(dir == RIGHT){
            return speed;
        }
        return 0;
    }

    private float getSpeedY(int dir) {
        if (dir == UP) {
            return -speed;
        }
        else if(dir == DOWN){
            return speed;
        }
        return 0;
    }
    public void setWizardHouse(ArrayList<Integer> wHouse){
        this.wHouse = wHouse;
    }
    /**
     * Is Junction
     * @param x
     * @param y
     * @return
     */
    public boolean isJunction(int x, int y){
        for (Tiles j : junctionList){
            if (j.getX() == x && j.getY() == y){
                return true;
            }
        }
        return true;
    }

    /** The inputs are the map and starting coordinates
     * And the outputs are the optimal path**/
    public ArrayList<Integer> findOptimalPath(int x, int y){
        int facingDirection = DOWN;
        ArrayList<Integer> pathTaken = new ArrayList<>();
        while (true){
            //Until wizard house
            int newX = -1;
            int newY = -1;
            switch (facingDirection) {
                case LEFT:
                    facingDirection = DOWN;
                    break;
                case RIGHT:
                    facingDirection = UP;
                    break;
                case UP:
                    facingDirection = LEFT;
                    break;
                case DOWN:
                    facingDirection =RIGHT;
                    break;
            }
            switch (facingDirection){
                case LEFT:
                    newX = x-32;
                    newY = y;
                    break;
                case RIGHT:
                    newX =x+32;
                    newY = y;
                    break;
                case UP:
                    newX = x;
                    newY = y-32;
                    break;
                case DOWN:
                    newX = x;
                    newY = y+32;
                    break;
            }
            while(! ((isPath(newX, newY) &&( newX <= 640 && newX >=0 && newY <= 680 && newY >40) )|| (newX == wHouse.get(0) && newY == wHouse.get(1) ))){
               //Until new path found
                switch (facingDirection) {
                    case LEFT:
                        facingDirection = UP;
                        break;
                    case RIGHT:
                        facingDirection = DOWN;
                        break;
                    case UP:
                        facingDirection = RIGHT;
                        break;
                    case DOWN:
                        facingDirection = LEFT;
                        break;
                }
                switch (facingDirection){
                    case LEFT:
                        newX = x-32;
                        newY = y;
                        break;
                    case RIGHT:
                        newX = x+32;
                        newY = y;
                        break;
                    case UP:
                        newX = x;
                        newY = y-32;
                        break;
                    case DOWN:
                        newX = x;
                        newY = y+32;
                        break;
                }
            }
            if (newX == wHouse.get(0) && newY == wHouse.get(1)){
                break;
            }
            else{
                pathTaken.add(facingDirection);
                x = newX;
                y = newY;
            }
        }
        //Optimize path
        int pointer = 0;
        while(pointer < pathTaken.size() - 1){
            if(((pathTaken.get(pointer) - pathTaken.get(pointer+1) )%2 == 0) && ((pathTaken.get(pointer) - pathTaken.get(pointer+1))!= 0)){
                pathTaken.remove(pointer + 1);
                pathTaken.remove(pointer);
                pointer = 0;
            }else{
                pointer++;
            }
        }

        return pathTaken;
    }


    /**
     * Is Path?
     * @param x
     * @param y
     * @return
     */
    public boolean isPath(int x, int y){
        for (Tiles t : tileList){
            if (t.getX() == x && t.getY() == y){
                return true;
            }
        }
        return false;
    }
    /**
     * Get path
     */
    public Tiles getPath(int x, int y){
        for (Tiles t : tileList){
            if (t.getX() == x && t.getY() == y){
                return t;
            }
        }
        return null;
    }




    /**
     * Handles logic of Entities
     */
    public void update(){
        for (Entities e : entFolder){
            if (e.getPathCounter() == 0){
                //Set path
                e.setOpPath(findOptimalPath((int)e.getX(),(int)e.getY()));
            }
            e.opMove(speed);
            System.out.println(speed);
        }

    }

    /**
     * Draws the entities to screen
     * @param app The window to draw onto.
     */
    public void draw(PApplet app) {
        // The image() method is used to draw PImages onto the screen.
        // The first argument is the image, the second and third arguments are coordinates
        for (Entities e : entFolder){
            //HP bar
            app.fill(255, 0, 0); //red
            app.rect((int)e.getX(), (int)e.getY() - 12,32 , 10);
            for (float i = 0; i< e.getHp(); i++){
                app.fill(0, 128, 0); //green
                app.rect((int)e.getX(), (int)e.getY() - 12, (( i / 100)* 32), 10);
            }



            //Draw entity
            app.image(e.getSprite(), (int) e.getX(), (int) e.getY());
        }
    }
}
