package pacman.model.entity.dynamic.physics;

/**
 * Encapsulation of a dynamic entity's motion.
 */
public interface KinematicState {

    /**
     * @return Vector2 The previous position before the last update.
     */
    Vector2D getPreviousPosition();

    /**
     * @return Vector2 The current position.
     */
    Vector2D getPosition();

    /**
     * @param position The new position of this state.
     */
    void setPosition(Vector2D position);

    /**
     * Retrieves the potential position given a possible direction
     *
     * @param direction the direction
     * @return the position given the direction
     */
    Vector2D getPotentialPosition(Direction direction);

    /**
     * Gets the speed of the Dynamic entity
     *
     * @return speed of the Dynamic entity
     */
    double getSpeed();

    /**
     * @param speed The new velocity of this state.
     */
    void setSpeed(double speed);

    /**
     * Updates the position of the Dynamic entity based on its direction and speed (velocity)
     */
    void update();

    /**
     * Updates the Dynamic entity's direction and velocity to correspond with left
     */
    void left();

    /**
     * Updates the Dynamic entity's direction and velocity to correspond with right
     */
    void right();

    /**
     * Updates the Dynamic entity's direction and velocity to correspond with up
     */
    void up();

    /**
     * Updates the Dynamic entity's direction and velocity to correspond with down
     */
    void down();

    /**
     * Gets the direction of the Dynamic entity
     *
     * @return direction of Dynamic entity
     */
    Direction getDirection();
}

