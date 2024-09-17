package WizardTD;

import processing.core.PApplet;
import processing.core.PImage;

public class Tiles {

    protected PImage tileImage;

    protected String type;

    protected int x;

    protected int y;

    protected int size;


    public Tiles(PImage tileImage,int x, int y, int size, String type){
        this.tileImage = tileImage;
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = size;
    }

    /**
     * Draws the shape to the screen.
     *
     * @param app The window to draw onto.
     */
    public void draw(PApplet app) {
        // The image() method is used to draw PImages onto the screen.
        // The first argument is the image, the second and third arguments are coordinates
        app.image(this.tileImage, this.x, this.y);
    }


    public String getType(){
        return this.type;
    }


    /**
     * Gets the x-coordinate.
     * @return The x-coordinate.
     */
    public int getX() {
        return this.x;
    }

    /**
     * Returns the y-coordinate.
     * @return The y-coordinate.
     */
    public int getY() {
        return this.y;
    }

}
