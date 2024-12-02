package pacman.model.entity.dynamic.ghost.Strategy;

import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.ghost.GhostMode; // Import GhostMode
import pacman.model.entity.dynamic.physics.Direction;
import pacman.model.entity.dynamic.physics.Vector2D;

import java.util.Set;

public class ClydeStrategy implements GhostStrategy {
    private static final int GRID_SIZE = 16;

    @Override
    public void update(GhostImpl ghost) {
        Set<Direction> possibleDirections = ghost.getPossibleDirections();
        Vector2D playerPosition = ghost.getPlayerPosition();
        GhostMode ghostMode = ghost.getGhostMode(); // Get the current ghost mode
        Vector2D targetLocation;


        if (ghostMode == GhostMode.CHASE) {
            double distance = calculateDistance(ghost.getPosition(), playerPosition);
            if (distance > 8 * GRID_SIZE) { // If more than 8 spaces
                targetLocation = playerPosition; // Target is Pac-Man
            } else {
                targetLocation = new Vector2D(0, 576); //bottom left corner
            }
        } else { 
            targetLocation = new Vector2D(0, 576); 
        }

        ghost.setTargetLocation(targetLocation); // Set the target location for the ghost
        ghost.selectDirection(possibleDirections); // Call the existing selectDirection method
    }

    // Helper function to calculate distance
    private double calculateDistance(Vector2D point1, Vector2D point2) {
        return Math.sqrt(Math.pow(point2.getX() - point1.getX(), 2) + Math.pow(point2.getY() - point1.getY(), 2));
    }
}
