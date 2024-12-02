package pacman.model.entity.dynamic.ghost.Decorator;

import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.physics.Vector2D;
import pacman.model.entity.dynamic.ghost.Strategy.GhostStrategy;
import pacman.model.maze.Maze;
import javafx.scene.image.Image;
import java.util.Random;

public class FrightenedStrategy extends GhostModeDecorator {
    private final Image frightenedImage;
    private final Maze maze;
    private final Random random = new Random();

    public FrightenedStrategy(GhostStrategy wrappedStrategy, Maze maze, String frightenedImagePath) {
        super(wrappedStrategy); // Pass the wrapped strategy to the abstract decorator
        this.maze = maze;
        this.frightenedImage = new Image(frightenedImagePath);
    }

    @Override
    public void update(GhostImpl ghost) {
        // Change to frightened mode appearance and behavior
        ghost.setImage(frightenedImage);
        ghost.setTargetLocation(new Vector2D(-1, -1)); // Set to a neutral target
    }
}
