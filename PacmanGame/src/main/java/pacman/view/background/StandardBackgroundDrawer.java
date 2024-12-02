package pacman.view.background;

import javafx.scene.layout.Pane;
import javafx.scene.paint.Paint;
import javafx.scene.shape.Rectangle;
import pacman.model.engine.GameEngine;

/**
 * Standard background drawer - draws black background
 */
public class StandardBackgroundDrawer implements BackgroundDrawer {

    @Override
    public void draw(GameEngine model, Pane pane) {
        double width = pane.getWidth();
        double height = pane.getHeight();

        Rectangle background = new Rectangle(0, 0, width, height);
        background.setFill(Paint.valueOf("BLACK"));
        background.setViewOrder(1000.0);

        pane.getChildren().add(background);
    }

}
