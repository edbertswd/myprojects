package WizardTD;


import processing.core.PImage;

public class Tower {
    private int x;
    private int y;
    private String towerType;

    private PImage tImage;



    public Tower(int x, int y, String towerType, PImage tImage){
        this.x = x;
        this.y = y;
        this.towerType = towerType;
        this.tImage = tImage;
    }


    public int getX(){
        return x;
    }

    public int getY(){
        return y;
    }

    public String getTowerType(){
        return towerType;
    }
    public void upgrade(){
        if (towerType == "tower0"){
            towerType = "tower1";
        }
        else if (towerType == "tower1"){
            towerType = "tower2";
        }
        else if (towerType == "tower2"){
            System.out.println("Tower is at max upgrade!");
        }
    }




}
