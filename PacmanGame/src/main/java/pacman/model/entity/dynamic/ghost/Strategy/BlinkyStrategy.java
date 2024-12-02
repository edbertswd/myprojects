package pacman.model.entity.dynamic.ghost.Strategy;

import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.ghost.GhostMode;
import pacman.model.entity.dynamic.physics.Direction;
import pacman.model.entity.dynamic.physics.Vector2D;

import java.util.Set;

public class BlinkyStrategy implements GhostStrategy {
    @Override
    public void update(GhostImpl ghost) {
        GhostMode ghostMode = ghost.getGhostMode();
        Set<Direction> possibleDirections = ghost.getPossibleDirections();
        Vector2D playerPosition = ghost.getPlayerPosition();
        Vector2D targetLocation;

        // Determine target location based on ghost mode
        if (ghostMode == GhostMode.CHASE) {
            // Target is Pac-Man's position in CHASE mode
            targetLocation = playerPosition;
        } else { // SCATTER mode
            targetLocation = new Vector2D(27 * 16, 0); // top right corner
        }

        ghost.setTargetLocation(targetLocation); // Set the target location for the ghost
        ghost.selectDirection(possibleDirections); // Call the existing selectDirection method
    }
}
