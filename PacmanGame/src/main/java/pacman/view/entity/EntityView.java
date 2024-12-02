package pacman.view.entity;

import javafx.scene.Node;
import pacman.model.entity.Renderable;

/**
 * Responsible for rendering Pac-Man game entity
 */
public interface EntityView {

    /**
     * Update rendering of Game entity with updated position, visibility etc.
     */
    void update();

    /**
     * Checks if two entities are equals
     *
     * @param entity entity to be checked
     * @return true, if entities are equal
     */
    boolean matchesEntity(Renderable entity);

    /**
     * Marks the entity view for deletion
     */
    void markForDelete();

    /**
     * Returns the display node for renderable
     *
     * @return display node for renderable
     */
    Node getNode();

    /**
     * Returns whether entity view has been marked for deletion
     *
     * @return true, if entity view has been marked for deletion
     */
    boolean isMarkedForDelete();
}
