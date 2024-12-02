package pacman.view.entity;

import javafx.scene.Node;
import javafx.scene.image.ImageView;
import javafx.scene.layout.HBox;
import pacman.model.entity.Renderable;

/**
 * Concrete implementation of EntityView
 */
public class EntityViewImpl implements EntityView {
    private final Renderable entity;
    private final ImageView node;
    private final HBox box;
    private boolean delete = false;

    public EntityViewImpl(Renderable entity) {
        this.entity = entity;
        box = new HBox();
        node = new ImageView(entity.getImage());
        box.getChildren().add(node);
        box.setViewOrder(getViewOrder(entity.getLayer()));
        box.setFillHeight(true);
        update();
    }

    private static double getViewOrder(Renderable.Layer layer) {
        return switch (layer) {
            case BACKGROUND -> 100.0;
            case FOREGROUND -> 50.0;
            case EFFECT -> 25.0;
            case INVISIBLE -> 0.0;
        };
    }

    @Override
    public void update() {
        if (entity.getLayer() != Renderable.Layer.INVISIBLE) {
            node.setVisible(true);
            if (!node.getImage().equals(entity.getImage())) {
                node.setImage(entity.getImage());
            }
            box.setLayoutX(entity.getPosition().getX());
            box.setLayoutY(entity.getPosition().getY());
            node.setFitHeight(entity.getHeight());
            node.setFitWidth(entity.getWidth());
            node.setPreserveRatio(true);
        } else {
            node.setVisible(false);
        }

        delete = false;
    }

    @Override
    public boolean matchesEntity(Renderable entity) {
        return this.entity.equals(entity);
    }

    @Override
    public void markForDelete() {
        delete = true;
    }

    @Override
    public Node getNode() {
        return box;
    }

    @Override
    public boolean isMarkedForDelete() {
        return delete;
    }
}

