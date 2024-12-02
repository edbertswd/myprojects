package pacman.model.entity.staticentity;

import pacman.model.entity.Renderable;

/**
 * Represents a Static Entity in Pac-Man game
 */
public interface StaticEntity extends Renderable {
    /**
     * Returns true if Dynamic Entities can pass through entity
     *
     * @return true, if Dynamic Entities can pass through entity
     */
    boolean canPassThrough();
}