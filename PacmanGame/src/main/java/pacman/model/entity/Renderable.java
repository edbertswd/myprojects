package pacman.model.entity;

import javafx.scene.image.Image;
import pacman.model.entity.dynamic.physics.BoundingBox;
import pacman.model.entity.dynamic.physics.Vector2D;

/**
 * Represents something that can be rendered in Pac-Man
 */
public interface Renderable {

    /**
     * @return image of renderable
     */
    Image getImage();

    /**
     * @return width of renderable image
     */
    double getWidth();

    /**
     * @return width of renderable height
     */
    double getHeight();

    /**
     * Returns the current (x, y) position of this Entity
     *
     * @return The x position using the top left hand corner as 0,0 and increasing as the position moves right on the screen.
     * The y position using the top left hand corner as 0.0 and increasing as the position moves down the screen
     */
    Vector2D getPosition();

    /**
     * Returns the current 'z' position to draw this entity. Order within each layer is undefined.
     *
     * @return The layer to draw the entity on.
     */
    Renderable.Layer getLayer();

    /**
     * Returns the bounding box of the renderable
     *
     * @return bounding box of the renderable
     */
    BoundingBox getBoundingBox();

    /**
     * Resets the renderable to intiial state
     */
    void reset();

    /**
     * The set of available layers
     */
    enum Layer {
        BACKGROUND, FOREGROUND, EFFECT, INVISIBLE
    }
}