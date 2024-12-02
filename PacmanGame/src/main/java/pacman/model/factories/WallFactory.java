package pacman.model.factories;

import javafx.scene.image.Image;
import pacman.ConfigurationParseException;
import pacman.model.entity.Renderable;
import pacman.model.entity.dynamic.physics.BoundingBox;
import pacman.model.entity.dynamic.physics.BoundingBoxImpl;
import pacman.model.entity.dynamic.physics.Vector2D;
import pacman.model.entity.staticentity.StaticEntityImpl;

import java.util.HashMap;
import java.util.Map;

/**
 * Concrete renderable factory for Wall objects
 */
public class WallFactory implements RenderableFactory {

    private static final Map<Character, Image> IMAGES = new HashMap<>();

    static {
        IMAGES.put(RenderableType.HORIZONTAL_WALL, new Image("maze/walls/horizontal.png"));
        IMAGES.put(RenderableType.VERTICAL_WALL, new Image("maze/walls/vertical.png"));
        IMAGES.put(RenderableType.UP_LEFT_WALL, new Image("maze/walls/upLeft.png"));
        IMAGES.put(RenderableType.UP_RIGHT_WALL, new Image("maze/walls/upRight.png"));
        IMAGES.put(RenderableType.DOWN_LEFT_WALL, new Image("maze/walls/downLeft.png"));
        IMAGES.put(RenderableType.DOWN_RIGHT_WALL, new Image("maze/walls/downRight.png"));
    }

    private final Renderable.Layer layer = Renderable.Layer.BACKGROUND;
    private final Image image;

    public WallFactory(char renderableType) {
        this.image = IMAGES.get(renderableType);
    }


    @Override
    public Renderable createRenderable(
            char renderableType,
            Vector2D position
    ) {
        try {

            BoundingBox boundingBox = new BoundingBoxImpl(
                    position,
                    image.getHeight(),
                    image.getWidth()
            );

            return new StaticEntityImpl(
                    boundingBox,
                    layer,
                    image
            );

        } catch (Exception e) {
            throw new ConfigurationParseException(
                    String.format("Invalid static entity configuration | %s", e));
        }
    }
}
