package pacman.model.entity.dynamic.ghost.Strategy;

import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.ghost.GhostMode;
import pacman.model.entity.dynamic.physics.Direction;
import pacman.model.entity.dynamic.physics.Vector2D;

import java.util.Set;

public class InkyStrategy implements GhostStrategy {
    @Override
    public void update(GhostImpl ghost) {
        GhostMode ghostMode = ghost.getGhostMode();
        Set<Direction> possibleDirections = ghost.getPossibleDirections();
        Vector2D blinkyPosition = ghost.getBlinkyPosition();
        Vector2D playerPosition = ghost.getPlayerPosition();

        Vector2D targetLocation;


        // Determine target location based on ghost mode
        if (ghostMode == GhostMode.CHASE) {
            // Calculate target position for Inky in CHASE mode
            Vector2D twoSpacesAhead = calculateTwoSpacesAhead(playerPosition, ghost.getDirection(), 16); 
            targetLocation = calculateInkyTarget(blinkyPosition, twoSpacesAhead);
        } else {
            targetLocation = new Vector2D(28 * 16, 36 * 16); //bottom right corner
        }

        ghost.setTargetLocation(targetLocation); // Set the target location for the ghost
        ghost.selectDirection(possibleDirections); // Call the existing selectDirection method
    }

    private Vector2D calculateTwoSpacesAhead(Vector2D playerPosition, Direction pacmanDirection, int gridSize) {
        Vector2D target = playerPosition;
        switch (pacmanDirection) {
            case UP -> target = new Vector2D(target.getX(), target.getY() - gridSize * 2);
            case DOWN -> target = new Vector2D(target.getX(), target.getY() + gridSize * 2);
            case LEFT -> target = new Vector2D(target.getX() - gridSize * 2, target.getY());
            case RIGHT -> target = new Vector2D(target.getX() + gridSize * 2, target.getY());
        }
        return target;
    }

    private Vector2D calculateInkyTarget(Vector2D blinkyPosition, Vector2D targetPosition) {
        Vector2D direction = subtract(targetPosition, blinkyPosition);
        return add(blinkyPosition, scale(direction, 2)); // Doubling the vector
    }

    // Method to subtract two Vector2D positions
    private Vector2D subtract(Vector2D v1, Vector2D v2) {
        return new Vector2D(v1.getX() - v2.getX(), v1.getY() - v2.getY());
    }

    // Method to add two Vector2D positions
    private Vector2D add(Vector2D v1, Vector2D v2) {
        return new Vector2D(v1.getX() + v2.getX(), v1.getY() + v2.getY());
    }

    // Method to scale a Vector2D position by a scalar value
    private Vector2D scale(Vector2D v, double scalar) {
        return new Vector2D(v.getX() * scalar, v.getY() * scalar);
    }
}
