package WizardTD;

import org.checkerframework.checker.units.qual.A;
import processing.core.PApplet;
import processing.core.PImage;
import processing.data.JSONArray;
import processing.data.JSONObject;
import processing.event.MouseEvent;

import java.awt.*;
import java.awt.geom.AffineTransform;
import java.awt.image.BufferedImage;

import java.io.*;
import java.util.*;

public class App extends PApplet {
    public static final int CELLSIZE = 32;
    public static final int SIDEBAR = 120;
    public static final int TOPBAR = 40;
    public static final int BOARD_WIDTH = 20;
    public static int WIDTH = CELLSIZE*BOARD_WIDTH+SIDEBAR;
    public static int HEIGHT = BOARD_WIDTH*CELLSIZE+TOPBAR;
    public static final int FPS = 60;
    double totalTimeInSeconds; // Total time for the countdown in seconds
    int framesElapsed = 0; // Frames elapsed since the start
    ArrayList<String> mapLayout;
    public String configPath;
    public Random random = new Random();
    public ArrayList<int[]> availableSpawn;
    private ArrayList<Tiles> mapLoc;

    public LinkedList <Tiles> junctionList;


    private JSONObject json;

    private ArrayList<Buttons> bFolder;

    private int countdown;

    private ArrayList<Tiles> pathList;

    private EntitiesManager eManager;
    private WaveManager waveManager;

    private HashMap<String, PImage> imageFolder;

    private ArrayList <Integer> wizardHouse;

    private TowerManager tManager;

    private boolean towClicked;

    private boolean towUpgradeClicked;

    private boolean pauseClicked;




    public App() {
        this.configPath = "config.json";
        this.availableSpawn = new ArrayList<>();
        this.mapLoc = new ArrayList<>();
        this.mapLayout = new ArrayList<>();
        this.pathList = new ArrayList<>();
        this.imageFolder = new HashMap<>();
        this.eManager = new EntitiesManager();
        this.wizardHouse = new ArrayList<>();
        this.junctionList = new LinkedList<>();
        this.towClicked = false;
        this.towUpgradeClicked = false;
        this.bFolder = new ArrayList<>();
        this.pauseClicked = false;
    }
    /**
     * Initialise the setting of the window size.
     */
	@Override
    public void settings() {
        size(WIDTH, HEIGHT);
    }


        /**
         * Updates the game
         */
    public void update(){
        drawButtons();
        drawMap();
        waveManager.draw(this);
        //Yellow buttons
        if (bFolder != null) {
            for (Buttons b : bFolder) {
                int[] coordinates = b.getCoordinates();
                if (isMouseOver(coordinates[0], coordinates[1], 32, 32)) {
                    b.setHover();
                }
                b.draw(this);
            }
        }
    }



    /**
     * Draw all elements in the game by current frame.
     */
    @Override
    public void draw() {
        //Update game
        update();

    }






    public void drawMap(){
        //Draw the map
        for (int x = 0; x<mapLoc.size(); x++){
            Tiles tempTile = mapLoc.get(x);
            tempTile.draw(this);
        }

    }

    public void drawButtons(){
        //Draw buttons
        fill(196,164,132);
        int sideStart = WIDTH-SIDEBAR;
        rect(sideStart, TOPBAR, SIDEBAR, HEIGHT);

        //FF
        fill(255, 255, 255);
        Buttons FF = new Buttons("FF", "2x speed", sideStart+12, TOPBAR+64, CELLSIZE*2, CELLSIZE*2);
        bFolder.add(FF);

        //P
        Buttons P = new Buttons("P", "PAUSE",sideStart+12, TOPBAR+64 * 2, CELLSIZE*2, CELLSIZE*2);
        bFolder.add(P);

        //T
        Buttons T = new Buttons("T", "Build tower",sideStart+12, TOPBAR+64 * 3, CELLSIZE*2, CELLSIZE*2);
        bFolder.add(T);
        //U1
        Buttons U1 = new Buttons("U1", "Upgrade Range",sideStart+12, TOPBAR+64 * 4, CELLSIZE*2, CELLSIZE*2);
        bFolder.add(U1);
        //U2
        Buttons U2 = new Buttons("U2", "Upgrade speed",sideStart+12, TOPBAR+64 * 5, CELLSIZE*2, CELLSIZE*2);
        bFolder.add(U2);
        //U3
        Buttons U3 = new Buttons("U3", "Upgrade damage",sideStart+12, TOPBAR+64 * 6, CELLSIZE*2, CELLSIZE*2);
        bFolder.add(U3);
        //M
        Buttons M = new Buttons("M", "Mana pool cost: ",sideStart+12, TOPBAR+64 * 7, CELLSIZE*2, CELLSIZE*2);
        bFolder.add(M);

    }



    /**
     * Load all resources such as images. Initialise the elements such as the player, enemies and map elements.
     */
	@Override
    public void setup() {
        this.json = loadJSONObject(configPath);
        frameRate(FPS);
        //load images
        PImage beetle = loadImage("src/main/resources/WizardTD/beetle.png");
        PImage fireball = loadImage("src/main/resources/WizardTD/fireball.png");
        PImage grass = loadImage("src/main/resources/WizardTD/grass.png");
        PImage gremlin = loadImage("src/main/resources/WizardTD/gremlin.png");
        PImage gremlin1 = loadImage("src/main/resources/WizardTD/gremlin1.png");
        PImage gremlin2 = loadImage("src/main/resources/WizardTD/gremlin2.png");
        PImage gremlin3 = loadImage("src/main/resources/WizardTD/gremlin3.png");
        PImage gremlin4 = loadImage("src/main/resources/WizardTD/gremlin4.png");
        PImage gremlin5 = loadImage("src/main/resources/WizardTD/gremlin5.png");
        PImage path0 = loadImage("src/main/resources/WizardTD/path0.png");
        PImage path1 = loadImage("src/main/resources/WizardTD/path1.png");
        PImage path2 = loadImage("src/main/resources/WizardTD/path2.png");
        PImage path3 = loadImage("src/main/resources/WizardTD/path3.png");
        PImage shrub = loadImage("src/main/resources/WizardTD/shrub.png");
        PImage tower0 = loadImage("src/main/resources/WizardTD/tower0.png");
        PImage tower1 = loadImage("src/main/resources/WizardTD/tower1.png");
        PImage tower2 = loadImage("src/main/resources/WizardTD/tower2.png");
        PImage wizard_house = loadImage("src/main/resources/WizardTD/wizard_house.png");
        PImage worm = loadImage("src/main/resources/WizardTD/worm.png");



        //Add to folder
        imageFolder.put("beetle", beetle);
        imageFolder.put("fireball", fireball);
        imageFolder.put("gremlin", gremlin);
        imageFolder.put("gremlin1", gremlin1);
        imageFolder.put("gremlin2", gremlin2);
        imageFolder.put("gremlin3", gremlin3);
        imageFolder.put("gremlin4", gremlin4);
        imageFolder.put("gremlin5", gremlin5);
        imageFolder.put("path0", path0);
        imageFolder.put("path1", path1);
        imageFolder.put("path2", path2);
        imageFolder.put("path3", path3);
        imageFolder.put("shrub", shrub);
        imageFolder.put("tower0", tower0);
        imageFolder.put("tower1",tower1);
        imageFolder.put("tower2", tower2);
        imageFolder.put("wizard_house", wizard_house);
        imageFolder.put("worm", worm);
        imageFolder.put("grass", grass);


        //PATHS
        //Read level file
        try {
            File f = new File("level2.txt");
            Scanner scan = new Scanner(f);
            while (scan.hasNextLine()) {
                String iterated = scan.nextLine();
                mapLayout.add(iterated);
            }
        } catch (Exception e){
            System.out.println("NO FILE FOUND!");
        }

        int frameCounterY = TOPBAR;
        int mapCounter = 0;
        for (int y = 0; y < mapLayout.size(); y ++) {
            int frameCounterX = 0;
            for (int x = 0; x < mapLayout.get(y).length(); x++) {
                //Shrub
                if (mapLayout.get(y).charAt(x) == 'S') {
                    Tiles tempTile = new Tiles(shrub, frameCounterX, frameCounterY, CELLSIZE, "Shrub");
                    mapLoc.add(mapCounter, tempTile);
                    mapCounter++;
                }
                //Wizard House
                else if (mapLayout.get(y).charAt(x) == 'W') {
                    Tiles tempTile = new Tiles(wizard_house, frameCounterX, frameCounterY, 48, "Wizard House");
                    wizardHouse.add(frameCounterX);
                    wizardHouse.add(frameCounterY);
                    mapLoc.add(mapCounter, tempTile);
                    mapCounter++;
                }
                //Path
                else if (mapLayout.get(y).charAt(x) == 'X'){
                    //Add to available spawn location
                    if (frameCounterX == 0 || frameCounterY == 40){
                        int [] tempSpawn = new int[2];
                        tempSpawn[0] = frameCounterX;
                        tempSpawn[1] = frameCounterY;
                        this.availableSpawn.add(tempSpawn);
                    }
                    boolean topCheck = false;
                    boolean botCheck = false;
                    boolean leftCheck = false;
                    boolean rightCheck = false;
                    //Check top
                    if (y>0){
                        if (mapLayout.get(y-1).charAt(x) == 'X'){
                            topCheck = true;
                        }
                    }
                    //Check bot
                    if ((y+1) < mapLayout.size()) {
                        if (mapLayout.get(y + 1).charAt(x) == 'X') {
                            botCheck = true;
                        }
                    }
                    //Check left
                    if (x>0){
                        if(mapLayout.get(y).charAt(x-1) == 'X'){
                            leftCheck = true;
                        }

                    }
                    //Check right
                    if ((x+1)< mapLayout.get(y).length()) {
                        if (mapLayout.get(y).charAt(x + 1) == 'X') {
                            rightCheck = true;
                        }
                    }
                    //Only's
                    if (rightCheck == true && leftCheck == false && topCheck == false&& botCheck == false){
                        Tiles tempTile = new Tiles(path0, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                    }
                    else if (leftCheck == true && rightCheck == false && topCheck == false && botCheck == false){
                        Tiles tempTile = new Tiles(path0, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                    }
                    else if (topCheck == true && rightCheck == false && leftCheck == false&& botCheck == false){
                        PImage rotatedImage = rotateImageByDegrees(path0, 90);
                        Tiles tempTile = new Tiles(rotatedImage, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                    }
                    else if (botCheck== true && rightCheck == false && topCheck == false&& leftCheck == false){
                        PImage rotatedImage = rotateImageByDegrees(path0, 90);
                        Tiles tempTile = new Tiles(rotatedImage, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                    }
                    //two's
                    else if (rightCheck == true && leftCheck == true && topCheck == false&& botCheck == false){
                        Tiles tempTile = new Tiles(path0, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                    }
                    else if (rightCheck == true && leftCheck == false && topCheck == true&& botCheck == false){
                        PImage rotatedImage = rotateImageByDegrees(path1, 180);
                        Tiles tempTile = new Tiles(rotatedImage, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                    }
                    else if (rightCheck == true && leftCheck == false && topCheck == false&& botCheck == true){
                        PImage rotatedImage = rotateImageByDegrees(path1, 270);
                        Tiles tempTile = new Tiles(rotatedImage, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);

                    }
                    else if (rightCheck == false && leftCheck == true && topCheck == true&& botCheck == false){
                        PImage rotatedImage = rotateImageByDegrees(path1, 90);
                        Tiles tempTile = new Tiles(rotatedImage, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);

                    }
                    else if (rightCheck == false && leftCheck == true && topCheck == false&& botCheck == true){
                        Tiles tempTile = new Tiles(path1, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                    }

                    else if (rightCheck == false && leftCheck == false && topCheck == true&& botCheck == true){
                        PImage rotatedImage = rotateImageByDegrees(path0, 90);
                        Tiles tempTile = new Tiles(rotatedImage, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                    }
                    //Threes
                    else if (rightCheck == false && leftCheck == true && topCheck == true&& botCheck == true){
                        PImage rotatedImage = rotateImageByDegrees(path2, 90);
                        Tiles tempTile = new Tiles(rotatedImage, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                        junctionList.add(tempTile);
                    }
                    else if (rightCheck == true && leftCheck == false && topCheck == true&& botCheck == true){
                        PImage rotatedImage = rotateImageByDegrees(path2, 90);
                        Tiles tempTile = new Tiles(rotatedImage, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                        junctionList.add(tempTile);
                    }
                    else if (rightCheck == true && leftCheck == false && topCheck == true&& botCheck == true){
                        PImage rotatedImage = rotateImageByDegrees(path2, 90);
                        Tiles tempTile = new Tiles(rotatedImage, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                        junctionList.add(tempTile);
                    }
                    else if (rightCheck == true && leftCheck == true && topCheck == false && botCheck == true){
                        Tiles tempTile = new Tiles(path2, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                        junctionList.add(tempTile);
                    }
                    else if (rightCheck == true && leftCheck == true && topCheck == true && botCheck == false){
                        PImage rotatedImage = rotateImageByDegrees(path2, 180);
                        Tiles tempTile = new Tiles(rotatedImage, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                        junctionList.add(tempTile);
                    }
                    //Fours
                    else if (rightCheck == true && leftCheck == true && topCheck == true && botCheck == true){
                        Tiles tempTile = new Tiles(path3, frameCounterX, frameCounterY, CELLSIZE, "Path");
                        mapLoc.add(mapCounter, tempTile);
                        mapCounter++;
                        pathList.add(tempTile);
                        junctionList.add(tempTile);
                    }
                }
                //Grass
                else {
                    Tiles tempTile = new Tiles(grass, frameCounterX, frameCounterY, CELLSIZE, "Grass");
                    mapLoc.add(mapCounter, tempTile);
                    mapCounter++;
                }
                frameCounterX = frameCounterX + CELLSIZE;
            }
            frameCounterY = frameCounterY + CELLSIZE;
        }



        //Background
        background(196,164,132);
        drawMap();


        //Wave Manager setup
        this.waveManager = new WaveManager(json.getJSONArray("waves"));
        waveManager.seteManager(eManager);
        eManager.setMapLoc(mapLoc);
        waveManager.setPathList(pathList);


        //Tower Manager setup
        this.tManager = new TowerManager();
        this.waveManager.settManager(tManager);
        this.tManager.setImageFolder(imageFolder);


        //Tower settings
        ArrayList<Double> towerSettings = new ArrayList<>();
        double t1 = json.getDouble("initial_tower_range");
        double t2 = json.getDouble("initial_tower_firing_speed");
        double t3 = json.getDouble("initial_tower_firing_speed");
        double t4 =  json.getDouble("initial_tower_damage");
        double t5 = json.getDouble("initial_mana");
        double t6 = json.getDouble("initial_mana_cap");
        double t7 = json.getDouble("initial_mana_gained_per_second");
        double t8 = json.getDouble("tower_cost");
        double t9 = json.getDouble("mana_pool_spell_initial_cost");
        double t10 = json.getDouble("mana_pool_spell_cost_increase_per_use");
        double t11 = json.getDouble("mana_pool_spell_cap_multiplier");
        double t12 = json.getDouble("mana_pool_spell_mana_gained_multiplier");

        towerSettings.add(t1);towerSettings.add(t2);towerSettings.add(t3);
        towerSettings.add(t4);towerSettings.add(t5);towerSettings.add(t6);
        towerSettings.add(t7);towerSettings.add(t8);towerSettings.add(t9);
        towerSettings.add(t10);towerSettings.add(t11);towerSettings.add(t12);
        tManager.setTowerSettings(towerSettings);

        //Wizard House
        this.eManager.setWizardHouse(wizardHouse);

        //Put tiles into tileFolder
        this.eManager.setTileList(pathList);
        this.eManager.setJunctionList(junctionList);
        this.eManager.setImageFolder(imageFolder);


    }

    public boolean isMouseOver(int x, int y , int w, int h){
        if (mouseX >= x && mouseX <= x + w && mouseY >= y && mouseY <= y + h){
            return true;
        }
        return false;
    }

    /**
     * Receive key pressed signal from the keyboard.
     */
	@Override
    public void keyPressed(){
        
    }

    /**
     * Receive key released signal from the keyboard.
     */
	@Override
    public void keyReleased(){

    }

    @Override
    public void mouseClicked(MouseEvent e){
        //Create tower at second click
        if (towClicked == true) {
            for (Tiles tile : mapLoc) {
                //if Tower Clicked again
                if (isMouseOver(tile.getX(), tile.getY(), 32, 32)) {
                    tManager.createTower("tower0", tile.getX(), tile.getY());
                    towClicked = false;
                }
            }
        }

        //Check active towers
        for (Tower tow : tManager.gettFolder()){
            if (isMouseOver(tow.getX(), tow.getY(), CELLSIZE, CELLSIZE)){
                if (towUpgradeClicked == true){
                    tManager.upgrade(tow);
                    towUpgradeClicked = false;
                }
            }

        }
        //Button Menu
        for (Buttons b: bFolder){
            int[] coords = b.getCoordinates();
            if (isMouseOver(coords[0], coords[1], CELLSIZE * 2, CELLSIZE * 2)){
                if (b.getText() == "FF"){

                }
                if (b.getText() == "P"){

                }
                if (b.getText() == "T"){
                    //Initiate tower boolean
                    if (towClicked == false) {
                        towClicked = true;
                    }
                }
                if (b.getText() == "U1"){
                    //Tower Upgrade
                    if (towUpgradeClicked == false) {
                        towUpgradeClicked= true;
                    }

                }
                if (b.getText() == "U2"){

                }
                if (b.getText() == "U3"){

                }
            }
        }
    }

    @Override
    public void mousePressed(MouseEvent e) {

    }

    @Override
    public void mouseReleased(MouseEvent e) {
    }

    /*@Override
    public void mouseDragged(MouseEvent e) {

    }*/


    public static void main(String[] args) {
        PApplet.main("WizardTD.App");
    }

    /**
     * Source: https://stackoverflow.com/questions/37758061/rotate-a-buffered-image-in-java
     * @param pimg The image to be rotated
     * @param angle between 0 and 360 degrees
     * @return the new rotated image
     */
    public PImage rotateImageByDegrees(PImage pimg, double angle) {
        BufferedImage img = (BufferedImage) pimg.getNative();
        double rads = Math.toRadians(angle);
        double sin = Math.abs(Math.sin(rads)), cos = Math.abs(Math.cos(rads));
        int w = img.getWidth();
        int h = img.getHeight();
        int newWidth = (int) Math.floor(w * cos + h * sin);
        int newHeight = (int) Math.floor(h * cos + w * sin);

        PImage result = this.createImage(newWidth, newHeight, ARGB);
        //BufferedImage rotated = new BufferedImage(newWidth, newHeight, BufferedImage.TYPE_INT_ARGB);
        BufferedImage rotated = (BufferedImage) result.getNative();
        Graphics2D g2d = rotated.createGraphics();
        AffineTransform at = new AffineTransform();
        at.translate((newWidth - w) / 2, (newHeight - h) / 2);

        int x = w / 2;
        int y = h / 2;

        at.rotate(rads, x, y);
        g2d.setTransform(at);
        g2d.drawImage(img, 0, 0, null);
        g2d.dispose();
        for (int i = 0; i < newWidth; i++) {
            for (int j = 0; j < newHeight; j++) {
                result.set(i, j, rotated.getRGB(i, j));
            }
        }

        return result;
    }
}
