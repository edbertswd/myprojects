package pacman.model.factories;

import javafx.scene.image.Image;
import pacman.ConfigurationParseException;
import pacman.model.entity.Renderable;
import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.ghost.GhostMode;
import pacman.model.entity.dynamic.ghost.GhostType.Blinky;
import pacman.model.entity.dynamic.ghost.GhostType.Clyde;
import pacman.model.entity.dynamic.ghost.GhostType.Inky;
import pacman.model.entity.dynamic.ghost.GhostType.Speedy;
import pacman.model.entity.dynamic.ghost.Strategy.BlinkyStrategy;
import pacman.model.entity.dynamic.ghost.Strategy.ClydeStrategy;
import pacman.model.entity.dynamic.ghost.Strategy.InkyStrategy;
import pacman.model.entity.dynamic.ghost.Strategy.SpeedyStrategy;
import pacman.model.entity.dynamic.physics.*;

import java.util.Arrays;
import java.util.List;

/**
 * Concrete renderable factory for Ghost objects
 */
public class GhostFactory implements RenderableFactory {

    private static final int RIGHT_X_POSITION_OF_MAP = 448;
    private static final int TOP_Y_POSITION_OF_MAP = 16 * 3;
    private static final int BOTTOM_Y_POSITION_OF_MAP = 16 * 34;

    private static final Image BLINKY_IMAGE = new Image("maze/ghosts/blinky.png");
    private static final Image INKY_IMAGE = new Image("maze/ghosts/inky.png");
    private static final Image CLYDE_IMAGE = new Image("maze/ghosts/clyde.png");
    private static final Image PINKY_IMAGE = new Image("maze/ghosts/pinky.png");

    private static final Image GHOST_IMAGE = BLINKY_IMAGE;
    List<Vector2D> targetCorners = Arrays.asList(
            new Vector2D(0, TOP_Y_POSITION_OF_MAP),
            new Vector2D(RIGHT_X_POSITION_OF_MAP, TOP_Y_POSITION_OF_MAP),
            new Vector2D(0, BOTTOM_Y_POSITION_OF_MAP),
            new Vector2D(RIGHT_X_POSITION_OF_MAP, BOTTOM_Y_POSITION_OF_MAP)
    );


    @Override
    public Renderable createRenderable(char renderableType, Vector2D position) {
        try {
            position = position.add(new Vector2D(4, -4));

            BoundingBox boundingBox = new BoundingBoxImpl(
                    position,
                    GHOST_IMAGE.getHeight(),
                    GHOST_IMAGE.getWidth()
            );

            KinematicState kinematicState = new KinematicStateImpl.KinematicStateBuilder()
                    .setPosition(position)
                    .build();

            GhostImpl ghost;

            // Create ghost with specific strategies
            switch (renderableType) {
                case RenderableType.BLINKY:
                    ghost = new Blinky(new BlinkyStrategy(), BLINKY_IMAGE, boundingBox, kinematicState, GhostMode.SCATTER, targetCorners.get(0));
                    break;
                case RenderableType.SPEEDY:
                    ghost = new Speedy(new SpeedyStrategy(), PINKY_IMAGE, boundingBox, kinematicState, GhostMode.SCATTER, targetCorners.get(1));
                    break;
                case RenderableType.INKY:
                    ghost = new Inky(new InkyStrategy(), INKY_IMAGE, boundingBox, kinematicState, GhostMode.SCATTER, targetCorners.get(2));
                    break;
                case RenderableType.CLYDE:
                    ghost = new Clyde(new ClydeStrategy(), CLYDE_IMAGE, boundingBox, kinematicState, GhostMode.SCATTER, targetCorners.get(3));
                    break;
                default:
                    ghost = new GhostImpl(new BlinkyStrategy(), BLINKY_IMAGE, boundingBox, kinematicState, GhostMode.SCATTER, targetCorners.get(0));
                    break;
            }
        return ghost;
        } catch (Exception e) {
            throw new ConfigurationParseException(
                    String.format("Invalid ghost configuration | %s ", e));
        }
    }


}
