package pacman.model.entity.dynamic.ghost.Strategy;

import pacman.model.entity.dynamic.ghost.GhostImpl;
import pacman.model.entity.dynamic.ghost.GhostMode; // Import GhostMode
import pacman.model.entity.dynamic.physics.Direction;
import pacman.model.entity.dynamic.physics.Vector2D;

import java.util.Set;

public class SpeedyStrategy implements GhostStrategy {
    private static final int GRID_SIZE = 16; // Assuming each grid space is 16 pixels

    @Override
    public void update(GhostImpl ghost) {
        Set<Direction> possibleDirections = ghost.getPossibleDirections();
        Vector2D playerPosition = ghost.getPlayerPosition();
        GhostMode ghostMode = ghost.getGhostMode(); // Get the current ghost mode
        Vector2D targetLocation;


        if (ghostMode == GhostMode.CHASE) {
            // Calculate target position for Speedy (4 spaces ahead of Pac-Man)
            targetLocation = calculateSpeedyTarget(playerPosition, ghost.getDirection(), GRID_SIZE);
        } else { // SCATTER mode
            targetLocation = new Vector2D(0, 0); // Top-left corner target
        }

        ghost.setTargetLocation(targetLocation); 
        ghost.selectDirection(possibleDirections); 
    }

    private Vector2D calculateSpeedyTarget(Vector2D playerPosition, Direction pacmanDirection, int gridSize) {
        Vector2D target = playerPosition;
        switch (pacmanDirection) {
            case UP -> target = target.add(new Vector2D(0, -gridSize * 4));
            case DOWN -> target = target.add(new Vector2D(0, gridSize * 4));
            case LEFT -> target = target.add(new Vector2D(-gridSize * 4, 0));
            case RIGHT -> target = target.add(new Vector2D(gridSize * 4, 0));
        }
        return target; // Return the calculated target position
    }
}
