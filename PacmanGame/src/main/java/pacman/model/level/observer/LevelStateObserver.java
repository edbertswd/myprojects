package pacman.model.level.observer;

import pacman.model.engine.observer.GameState;

/***
 * Observer for LevelStateSubject which is interested in the number of lives of the player and the game state
 */
public interface LevelStateObserver {
    /**
     * Updates observer with the number of lives of player
     *
     * @param numLives number of lives of player
     */
    void updateNumLives(int numLives);

    /**
     * Updates observer with the game state
     *
     * @param gameState the state of the game
     */
    void updateGameState(GameState gameState);

    /**
     * Updates observer with the score change
     *
     * @param scoreChange the change in score
     */
    void updateScore(int scoreChange);
}
