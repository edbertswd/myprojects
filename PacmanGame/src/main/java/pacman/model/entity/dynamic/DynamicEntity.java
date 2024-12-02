package pacman.model.entity.dynamic;

import pacman.model.entity.Renderable;
import pacman.model.entity.dynamic.physics.Direction;
import pacman.model.entity.dynamic.physics.Vector2D;
import pacman.model.level.Level;

import java.util.Set;

/**
 * Represents a dynamic entity in the Pac-Man Game
 */
public interface DynamicEntity extends Renderable {

    double COLLISION_OFFSET = 4;

    /**
     * Updates the position of the Dynamic Entity
     */
    void update();

    /**
     * @return Vector2 The previous top left anchor position prior to the last update.
     */
    Vector2D getPositionBeforeLastUpdate();

    /**
     * Sets the position of the Dynamic Entity
     *
     * @param position position to be used
     */
    void setPosition(Vector2D position);

    /**
     * Checks if Dynamic Entity has collided with renderable
     *
     * @param renderable renderable to be checked for collision with Dynamic Entity
     * @return true, if Dynamic Entity has collided with renderable
     */
    boolean collidesWith(Renderable renderable);

    /**
     * Handles collision of Dynamic Entity with renderable
     *
     * @param level      level currently being played
     * @param renderable renderable the Dynamic Entity has collided with
     */
    void collideWith(Level level, Renderable renderable);

    /**
     * Sets the possible directions for movement for the Dynamic Entity
     *
     * @param possibleDirections possible directions for movement for the Dynamic Entity
     */
    void setPossibleDirections(Set<Direction> possibleDirections);

    /**
     * Gets the current direction of the Dynamic Entity
     *
     * @return current direction of the Dynamic Entity
     */
    Direction getDirection();

    /**
     * Gets position of center of Dynamic Entity
     *
     * @return center position
     */
    Vector2D getCenter();
}