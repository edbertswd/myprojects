package pacman.model.engine.observer;


/***
 * Subject that is being observed by GameStateObserver
 */
public interface GameStateSubject {

    /**
     * Adds an observer to list of observers for subject
     *
     * @param observer observer for GameStateSubject
     */
    void registerObserver(GameStateObserver observer);

    /**
     * Notifies observer of change in the game state
     */
    void notifyObserversWithGameState();
}
