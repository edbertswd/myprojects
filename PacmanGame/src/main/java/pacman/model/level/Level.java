package pacman.model.level;

import pacman.model.entity.Renderable;
import pacman.model.entity.staticentity.collectable.Collectable;
import pacman.model.level.observer.LevelStateSubject;

import java.util.List;

/**
 * The base interface for a Pac-Man level.
 */
public interface Level extends LevelStateSubject {
    /**
     * Return a list of the currently existing Renderables
     *
     * @return The list of current renderable for this level
     */
    List<Renderable> getRenderables();

    /**
     * Instruct the level to progress forward in time by one increment.
     */
    void tick();

    /**
     * Move the player up
     */
    void moveUp();

    /**
     * Move the player down
     */
    void moveDown();

    /**
     * Move the player left
     */
    void moveLeft();

    /**
     * Move the player right
     */
    void moveRight();

    /**
     * Checks if the given renderable is the Player
     *
     * @param renderable
     * @return true, if renderable is the Player renderable
     */
    boolean isPlayer(Renderable renderable);

    /**
     * Checks if the given renderable is a Collectable for the level
     *
     * @param renderable
     * @return true, if renderable is a Collectable for the level
     */
    boolean isCollectable(Renderable renderable);

    /**
     * Collects the points of the collectable for the player
     *
     * @param collectable collectable collected by Player
     */
    void collect(Collectable collectable);

    /***
     * Gets the number of lives left in the level
     * @return number of lives the player has left in the level
     */
    int getNumLives();

    /**
     * Checks if the current level has been finished (i.e. if the player has collected all collectables)
     *
     * @return true, if player has collected all collectables
     */
    boolean isLevelFinished();

    /**
     * Gets the number of points the player has earned in the level.
     *
     * @return number of points the player has earned in the level
     */
    int getPoints();

    /**
     * Instructs the level to handle the player losing a life.
     * Level resets dynamic entities to starting positions.
     */
    void handleLoseLife();

    /**
     * Instructs the level to handle the game ending.
     * Level will remove all dynamic entities from game.
     */
    void handleGameEnd();
}
