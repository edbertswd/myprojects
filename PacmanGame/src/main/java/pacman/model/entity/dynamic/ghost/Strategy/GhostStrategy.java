package pacman.model.entity.dynamic.ghost.Strategy;

import pacman.model.entity.dynamic.ghost.GhostImpl;

public interface GhostStrategy {
    /**
     * Method that every strategy implements
     * @param ghost
     */
    void update(GhostImpl ghost);
}
