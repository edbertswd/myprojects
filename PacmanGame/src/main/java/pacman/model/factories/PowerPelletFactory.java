package pacman.model.factories;

import javafx.scene.image.Image;
import pacman.ConfigurationParseException;
import pacman.model.entity.Renderable;
import pacman.model.entity.dynamic.physics.BoundingBox;
import pacman.model.entity.dynamic.physics.BoundingBoxImpl;
import pacman.model.entity.dynamic.physics.Vector2D;
import pacman.model.entity.staticentity.collectable.PowerPellet;

/**
 * Concrete renderable factory for PowerPellet objects
 */
public class PowerPelletFactory implements RenderableFactory {
    // Using the same pellet image
    private static final Image PELLET_IMAGE = new Image("maze/pellet.png");
    
    // Power pellet properties
    private static final int POWER_PELLET_POINTS = 50; // Points earned for collecting a power pellet
    private final Renderable.Layer layer = Renderable.Layer.BACKGROUND;

    @Override
    public Renderable createRenderable(
            char renderableType,
            Vector2D position
    ) {
        try {
            // Apply offset (-8, -8) to center the power pellet
            Vector2D adjustedPosition = position.add(new Vector2D(-8, -8));

            // Create bounding box with doubled size
            BoundingBox boundingBox = new BoundingBoxImpl(
                    adjustedPosition,
                    PELLET_IMAGE.getHeight() * 2,
                    PELLET_IMAGE.getWidth() * 2
            );

            // Return a new PowerPellet with the adjusted properties
            return new PowerPellet(
                    boundingBox,
                    layer,
                    PELLET_IMAGE,
                    POWER_PELLET_POINTS
            );

        } catch (Exception e) {
            throw new ConfigurationParseException(
                    String.format("Invalid power pellet configuration | %s", e));
        }
    }
}
