package pacman.model.entity.dynamic.physics;

/**
 * Represents the cardinal directions allowed for movement in Pac-Man
 */
public enum Direction {
    UP, DOWN, LEFT, RIGHT;

    /**
     * Retrieves the opposite direction
     *
     * @return the opposite direction
     */
    public Direction opposite() {
        return switch (this) {
            case UP -> DOWN;
            case DOWN -> UP;
            case LEFT -> RIGHT;
            case RIGHT -> LEFT;
        };
    }
}
