package pacman.model.engine.observer;

/***
 * Observer for GameStateSubject
 */
public interface GameStateObserver {
    /**
     * Updates observer with the new game state
     *
     * @param gameState state of the game
     */
    void updateGameState(GameState gameState);
}
