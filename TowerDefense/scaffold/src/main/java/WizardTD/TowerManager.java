package WizardTD;

import processing.core.PApplet;
import processing.core.PImage;

import java.util.ArrayList;
import java.util.HashMap;

public class TowerManager {
    private Tower tower;
    private int x;
    private int y;

    private String towerType;



    private PImage tImage;

    private HashMap<String, PImage> imageFolder;

    private ArrayList<Tower> tFolder;
    private double initialRange;
    private double initialFiringSpeed;
    private double initialDamage;
    private double initialMana;
    private double initialManaCap;
    private double initialManaGained;

    private double towerCost;
    private double manaPoolSpellInitialCost;
    private double manaPoolSpellIncreaseCost;
    private double manaPoolSpellCapMultiplier;
    private double manaPoolSpellManaGainedMultiplier;


    public void setTowerSettings(ArrayList<Double> towerSettings){
        initialRange = towerSettings.get(0);
        initialFiringSpeed = towerSettings.get(1);
        initialDamage = towerSettings.get(2);
        initialMana = towerSettings.get(3);
        initialManaCap = towerSettings.get(4);
        initialManaGained = towerSettings.get(5);
        towerCost = towerSettings.get(6);
        manaPoolSpellInitialCost = towerSettings.get(7);
        manaPoolSpellIncreaseCost = towerSettings.get(8);
        manaPoolSpellCapMultiplier = towerSettings.get(9);
        manaPoolSpellManaGainedMultiplier = towerSettings.get(10);
    }



    public TowerManager(){
        this.tFolder = new ArrayList<Tower>();
    }
    public void setImageFolder( HashMap<String, PImage> imageFolder){
        this.imageFolder = imageFolder;
    }


    public void createTower(String towerType, int x, int y){
        Tower tower = new Tower(x, y, towerType, imageFolder.get(towerType));
        this.tFolder.add(tower);
    }



    public PImage getImage(String image){
        return imageFolder.get(image);
    }

    public ArrayList<Tower> gettFolder() {
        return tFolder;
    }

    public void upgrade(Tower tow){
        tow.upgrade();
    }

    public void update(){
        for (Tower t:tFolder){
            if (t.getTowerType() == "tower0"){


            }
            if (t.getTowerType() == "tower1"){


            }
            if (t.getTowerType() == "tower2"){


            }
        }

    }


    public void draw(PApplet app) {
        update();
        for (Tower t : tFolder){
            app.image(imageFolder.get(t.getTowerType()), t.getX(), t.getY(), 32, 32);
        }

    }





}
