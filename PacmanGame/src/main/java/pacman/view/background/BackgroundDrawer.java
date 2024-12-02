package pacman.view.background;

import javafx.scene.layout.Pane;
import pacman.model.engine.GameEngine;

/**
 * Draws background of Game Screen
 */
public interface BackgroundDrawer {

    void draw(GameEngine model, Pane pane);
}
