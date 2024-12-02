package pacman.model.entity.dynamic.ghost;

/***
 * Represents the different modes of ghosts, which determines how ghosts choose their target locations
 */
public enum GhostMode {
    SCATTER,
    CHASE,
    FRIGHTENED;

    /**
     * Ghosts alternate between SCATTER and CHASE mode normally
     * @param ghostMode current ghost mode
     * @return next ghost mode
     */
    public static GhostMode getNextGhostMode(GhostMode ghostMode) {
        switch (ghostMode) {
            case SCATTER:
                return CHASE;
            case CHASE:
                return SCATTER;
            case FRIGHTENED:
                return SCATTER;
            default:
                return SCATTER;
        }
    }
}
