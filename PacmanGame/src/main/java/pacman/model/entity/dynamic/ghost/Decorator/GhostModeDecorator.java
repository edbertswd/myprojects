package pacman.model.entity.dynamic.ghost.Decorator;

import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.ghost.Strategy.GhostStrategy;
import pacman.model.entity.dynamic.physics.Direction;
import pacman.model.entity.dynamic.physics.Vector2D;

import java.util.Set;

import javafx.scene.image.Image;

import java.util.Random;

/**
 * Decorator class that modifies the ghost's movement behavior in FRIGHTENED mode.
 */
public class GhostModeDecorator implements GhostStrategy {
    private final GhostStrategy wrappedStrategy;
    private final Random random = new Random();
    private static final Image FRIGHTENED_IMAGE = new Image("maze/ghosts/frightened.png");

    /**
     * Constructor for GhostModeDecorator.
     * @param wrappedStrategy the original ghost strategy 
     */
    public GhostModeDecorator(GhostStrategy wrappedStrategy) {
        this.wrappedStrategy = wrappedStrategy;
    }

    /**
     * Updates the ghost's movement behavior in FRIGHTENED mode.
     * In this mode, the ghost has no specific target and moves randomly at intersections.
     */
    @Override
    public void update(GhostImpl ghost) {
        ghost.setImage(FRIGHTENED_IMAGE);
        Vector2D neutralTarget = new Vector2D(-1, -1);
        ghost.setTargetLocation(neutralTarget); // no specific target 
               
    }
}
