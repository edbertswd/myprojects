package pacman.model.entity.staticentity;

import javafx.scene.image.Image;
import pacman.model.entity.Renderable;
import pacman.model.entity.dynamic.physics.BoundingBox;
import pacman.model.entity.dynamic.physics.Vector2D;

public class StaticEntityImpl implements Renderable, StaticEntity {

    private final Image image;
    private final BoundingBox boundingBox;
    private Layer layer;

    public StaticEntityImpl(BoundingBox boundingBox, Layer layer, Image image) {
        this.image = image;
        this.layer = layer;
        this.boundingBox = boundingBox;
    }

    @Override
    public double getWidth() {
        return this.boundingBox.getWidth();
    }

    @Override
    public double getHeight() {
        return this.boundingBox.getHeight();
    }

    @Override
    public Image getImage() {
        return image;
    }

    @Override
    public Vector2D getPosition() {
        return new Vector2D(boundingBox.getLeftX(), boundingBox.getTopY());
    }

    @Override
    public Layer getLayer() {
        return this.layer;
    }

    protected void setLayer(Layer layer) {
        this.layer = layer;
    }

    @Override
    public void reset() {
    }

    @Override
    public BoundingBox getBoundingBox() {
        return this.boundingBox;
    }

    @Override
    public boolean canPassThrough() {
        return false;
    }
}