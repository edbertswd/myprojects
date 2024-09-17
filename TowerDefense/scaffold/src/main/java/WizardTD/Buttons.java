package WizardTD;

import processing.core.PApplet;
import java.awt.*;

public class Buttons {
    private int x, y, width, height;
    private String text , textDetails;

    private boolean hover;

    public Buttons(String text,String textDetails, int x, int y, int width, int height){
            this.text = text;
            this.textDetails = textDetails;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.hover = false;
    }

    public int[] getCoordinates(){
        int[] temp = {x, y};
        return temp;
    }

    public String getText(){
        return text;
    }

    public String[] getTextDetails(){
        String[] splitText = textDetails.split(" ");
        return splitText;
    }

    public void setHover(){
        this.hover = true;
    }





    public void draw(PApplet app){
        if (hover) {
            // Turn yellow
            app.fill(255,255,0);
        }else{
            app.fill(196, 164, 132);
        }
        app.rect(x, y, width-24, height-12);
        app.fill(0,0,0);
        app.textSize(12);
        app.text(this.text, x+12, y+12, 128, 128);
        int sCount = 12;
        for (String s: getTextDetails()){
            app.text(s, x+45, y+sCount, 128, 128);
            sCount += 14;
        }

    }




}
