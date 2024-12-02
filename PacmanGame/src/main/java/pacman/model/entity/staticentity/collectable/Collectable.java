package pacman.model.entity.staticentity.collectable;

import pacman.model.entity.Renderable;

/**
 * Represents a collectable entity in the Pac-Man Game.
 * The collection of a collectable rewards the player with points;
 */
public interface Collectable extends Renderable {
    /**
     * Sets collectable to collected
     */
    void collect();

    /**
     * Returns whether the collectable is currently collectable
     * If the player has not collected it this level, it is collectable.
     *
     * @return true, if collectable is currently collectable
     */
    boolean isCollectable();

    /**
     * Returns the number of points earned from collecting collectable
     *
     * @return number of points earned from collecting collectable
     */
    int getPoints();
}
