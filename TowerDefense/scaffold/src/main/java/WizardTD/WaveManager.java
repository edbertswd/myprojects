package WizardTD;

import processing.core.PApplet;
import processing.core.PImage;
import processing.data.JSONArray;
import processing.data.JSONObject;

import java.util.*;

public class WaveManager extends App{
    private JSONArray waves;

    private JSONObject waveOne;
    private JSONObject waveTwo;
    private JSONObject waveThree;

    private int[] spawnPoint;

    private int duration;

    private int countdown;

    private int pwp;

    private JSONObject mArray;

    private String type;
    private int hp;
    private int speed;
    private int armour;

    private int mana;
    private int mana_gained_on_kill;

    private int quantity;

    private int frameCount;

    private boolean waveOneFinished;
    private boolean waveTwoFinished;
    private boolean waveThreeFinished;

    private boolean waveSet;

    private int waveNumber;
    private ArrayList<Tiles> pathList;

    private HashMap<String, PImage> imageFolder;
    private EntitiesManager eManager;

    private TowerManager tManager;

    public Random random = new Random();


    public WaveManager(JSONArray waves){
        this.waves = waves;
        this.waveOne = waves.getJSONObject(0);
        this.waveTwo = waves.getJSONObject(1);
        this.waveThree = waves.getJSONObject(2);
        this.waveOneFinished = false;
        this.waveSet = false;
        this.mana = 100;
    }

    public void setImageFolder(HashMap<String, PImage> imageFolder){
        this.imageFolder = imageFolder;
    }

    /**
     * Generates a random spawnpoint
     * @return
     */
    public int[] getRandomSpawn(){
        return availableSpawn.get(random.nextInt(availableSpawn.size()));
    }

    public void setSpawn(int[] spawnPoint){
        this.spawnPoint = spawnPoint;
    }

    public void setPathList(ArrayList<Tiles> pathList){
        this.pathList = pathList;
    }
    public void seteManager(EntitiesManager eManager){
        this.eManager = eManager;
    }
    public void settManager(TowerManager tManager){
        this.tManager = tManager;
    }


    public void setWaveNumber(int waveNumber){
        if (waveSet == false) {
            if (waveNumber == 1) {
                this.waveNumber = 1;
                //Setup for wave 1
                this.type = waveOne.getJSONArray("monsters").getJSONObject(0).getString("type");
                this.duration = waveOne.getInt("duration");
                this.countdown = duration;
                this.pwp = waveOne.getInt("pre_wave_pause");
                this.hp = waveOne.getJSONArray("monsters").getJSONObject(0).getInt("hp");
                this.speed = waveOne.getJSONArray("monsters").getJSONObject(0).getInt("speed");
                this.armour = waveOne.getJSONArray("monsters").getJSONObject(0).getInt("armour");
                this.mana_gained_on_kill = waveOne.getJSONArray("monsters").getJSONObject(0).getInt("mana_gained_on_kill");
                this.quantity = waveOne.getJSONArray("monsters").getJSONObject(0).getInt("quantity");
                waveSet = true;
            }
            if (waveNumber == 2) {
                this.waveNumber = 2;
                //Setup for wave 2
                this.type = waveTwo.getJSONArray("monsters").getJSONObject(0).getString("type");
                this.duration = waveTwo.getInt("duration");
                this.countdown = duration;
                this.pwp = waveTwo.getInt("pre_wave_pause");
                this.hp = waveTwo.getJSONArray("monsters").getJSONObject(0).getInt("hp");
                this.speed = waveTwo.getJSONArray("monsters").getJSONObject(0).getInt("speed");
                this.armour = waveTwo.getJSONArray("monsters").getJSONObject(0).getInt("armour");
                this.mana_gained_on_kill = waveTwo.getJSONArray("monsters").getJSONObject(0).getInt("mana_gained_on_kill");
                this.quantity = waveTwo.getJSONArray("monsters").getJSONObject(0).getInt("quantity");
                waveSet = true;
            }

            if (waveNumber == 3) {
                this.waveNumber = 3;
                //Setup for wave 3
                this.type = waveThree.getJSONArray("monsters").getJSONObject(0).getString("type");
                this.duration = waveThree.getInt("duration");
                this.countdown = duration;
                this.pwp = waveThree.getInt("pre_wave_pause");
                this.hp = waveThree.getJSONArray("monsters").getJSONObject(0).getInt("hp");
                this.speed = waveThree.getJSONArray("monsters").getJSONObject(0).getInt("speed");
                this.armour = waveThree.getJSONArray("monsters").getJSONObject(0).getInt("armour");
                this.mana_gained_on_kill = waveThree.getJSONArray("monsters").getJSONObject(0).getInt("mana_gained_on_kill");
                this.quantity = waveThree.getJSONArray("monsters").getJSONObject(0).getInt("quantity");
                waveSet = true;
            }
        }
    }


    public void waveOne(){
        //Wave One
        //Countdown
        // Update the countdown at 60 fps
        eManager.setSpawn(pathList.get(0).getX(), pathList.get(0).getY());
        int currentTime = frameCount / 60;
        countdown = max(duration - currentTime, 0);
        if (frameCount % 60 == 0 && countdown > 0) {
            if (quantity > 0) {
                eManager.createEntity(type, hp, speed, armour, mana_gained_on_kill);
                quantity--;
            }

        }
        //Spawn Monster Countdown
        if (countdown == 0){
            waveOneFinished = true;
        }






    }

    public void waveTwo(){


    }

    public void waveThree() {
    }



    public void update(){
        eManager.update();
        this.frameCount++;
        if (waveOneFinished == false){
            setWaveNumber(1);
            waveOne();
        }
        else if (waveTwoFinished == false){
            setWaveNumber(2);
            waveTwo();
        }
        else{
            setWaveNumber(3);
            waveThree();
        }


    }


    public void draw(PApplet app) {
        update();
        // Clear the top bar
        app.fill(196,164,132); app.rect(0,0, 760, 40);
        //Display Countdown
        app.fill(255, 255, 255);
        app.textSize(30);
        String txt = "Wave 2 starts:  "+ countdown;
        app.text(txt, 0, 30);
        //Draw monsters
        eManager.draw(app);

        //Towers
        tManager.draw(app);



    }

}
