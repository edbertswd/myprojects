package pacman.model.entity.dynamic.player.observer;

/***
 * Subject that is being observed by PlayerPositionObserver
 */
public interface PlayerPositionSubject {

    /**
     * Adds an observer to list of observers for subject
     *
     * @param observer observer for PlayerPositionSubject
     */
    void registerObserver(PlayerPositionObserver observer);

    /**
     * Removes an observer from list of observers for subject
     *
     * @param observer observer for PlayerPositionObserver
     */
    void removeObserver(PlayerPositionObserver observer);

    /**
     * Notifies observer of change in player's position
     */
    void notifyObservers();
}
