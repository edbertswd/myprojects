package pacman.model.level.observer;

/***
 * Subject that is being observed by LevelStateObserver
 */
public interface LevelStateSubject {

    /**
     * Adds an observer to list of observers for subject
     *
     * @param observer observer for LevelStateSubject
     */
    void registerObserver(LevelStateObserver observer);

    /**
     * Removes an observer from list of observers for subject
     *
     * @param observer observer for GameStateSubject
     */
    void removeObserver(LevelStateObserver observer);

    /**
     * Notifies observer of change in player's lives
     */
    void notifyObserversWithNumLives();

    /**
     * Notifies observer of change in the game state
     */
    void notifyObserversWithGameState();

    /**
     * Notifies observer of change in the player's score
     *
     * @param scoreChange score change of the player
     */
    void notifyObserversWithScoreChange(int scoreChange);
}
