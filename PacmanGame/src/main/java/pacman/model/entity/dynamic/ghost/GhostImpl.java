package pacman.model.entity.dynamic.ghost;

import javafx.scene.image.Image;
import pacman.model.entity.Renderable;
import pacman.model.entity.dynamic.ghost.Decorator.GhostModeDecorator;
import pacman.model.entity.dynamic.ghost.State.EdibleInterface;
import pacman.model.entity.dynamic.ghost.State.EdibleState;
import pacman.model.entity.dynamic.ghost.State.GhostContext;
import pacman.model.entity.dynamic.ghost.State.NormalState;
import pacman.model.entity.dynamic.ghost.Strategy.BlinkyStrategy;
import pacman.model.entity.dynamic.ghost.Strategy.GhostStrategy;
import pacman.model.entity.dynamic.physics.*;
import pacman.model.entity.dynamic.player.Pacman;
import pacman.model.level.Level;
import pacman.model.level.LevelImpl;
import pacman.model.maze.Maze;

import java.util.*;

/**
 * Concrete implementation of Ghost entity in Pac-Man Game
 */
public class GhostImpl implements Ghost {

    private static final int minimumDirectionCount = 8;
    private final Layer layer = Layer.FOREGROUND;
    private Image image;
    private final BoundingBox boundingBox;
    private final Vector2D startingPosition;
    private final Vector2D targetCorner;
    private KinematicState kinematicState;
    private GhostMode ghostMode;
    private Vector2D targetLocation;
    private Vector2D playerPosition;
    private Direction currentDirection;
    private Set<Direction> possibleDirections;
    private Map<GhostMode, Double> speeds;
    private int currentDirectionCount = 0;
    private GhostStrategy currentStrategy;
    private GhostStrategy baseStrategy;
    private Vector2D ghostPosition;
    private Vector2D blinkyPosition;
    private EdibleInterface normalState;
    private EdibleInterface edibleState;
    private GhostContext context;
    private static final int RESPAWN_DELAY_TICKS = 60; // 1 second delay at 60 FPS
    private int respawnTickCounter = 0;
    private boolean isRespawning = false;

    public GhostImpl(GhostStrategy ghostStrategy, Image image, BoundingBox boundingBox, KinematicState kinematicState, GhostMode ghostMode, Vector2D targetCorner) {
        this.image = image;
        this.boundingBox = boundingBox;
        this.kinematicState = kinematicState;
        this.startingPosition = kinematicState.getPosition();
        this.ghostMode = ghostMode;
        this.possibleDirections = new HashSet<>();
        this.targetCorner = targetCorner;
        this.targetLocation = getTargetLocation();
        this.currentDirection = null;
        this.baseStrategy = ghostStrategy;
        this.currentStrategy = ghostStrategy;
        this.ghostPosition = new Vector2D(0, 0);
        this.blinkyPosition = new Vector2D(0, 0);
        this.normalState = new NormalState();
        this.edibleState = new EdibleState();
        this.context = new GhostContext();

    }



    public GhostContext getContext(){
        return this.context;
    }
   
    public GhostMode getGhostMode(){
        return this.ghostMode;
    }


    @Override
    public void setSpeeds(Map<GhostMode, Double> speeds) {
        this.speeds = speeds;
    }


    public void setGhostPoition(Vector2D ghostPosition){
        this.ghostPosition = ghostPosition;
    }


    public void setStrategy(GhostStrategy ghostStrategy){
        this.currentStrategy = ghostStrategy;
    }

    

    @Override
    public Image getImage() {
        return image;
    }

    public void setImage(Image image){
        this.image = image;
    }



    @Override
    public void update() {
        if (isRespawning){
            // Handle the 1-second delay
            if (respawnTickCounter < RESPAWN_DELAY_TICKS) {
                respawnTickCounter++;
                return; 
            }
            isRespawning = false;
            this.setGhostMode(GhostMode.SCATTER);
        }
        this.ghostPosition = getPosition();


        // Update Blinky's position if the current strategy is BlinkyStrategy
        if (this.currentStrategy instanceof BlinkyStrategy) {
            this.blinkyPosition = ghostPosition;
        }
        this.setBlinkyPosition(blinkyPosition); //keep track of blinky's position in the ghost
        currentStrategy.update(this);
        this.updateDirection();
        this.kinematicState.update();
        this.boundingBox.setTopLeft(this.kinematicState.getPosition());

    }


    private void updateDirection() {
        // Ghosts update their target location when they reach an intersection
        if (Maze.isAtIntersection(this.possibleDirections)) {
            this.targetLocation = getTargetLocation();
        }

        Direction newDirection = selectDirection(possibleDirections);

        // Ghosts have to continue in a direction for a minimum time before changing direction
        if (this.currentDirection != newDirection) {
            this.currentDirectionCount = 0;
        }
        this.currentDirection = newDirection;

        switch (currentDirection) {
            case LEFT -> this.kinematicState.left();
            case RIGHT -> this.kinematicState.right();
            case UP -> this.kinematicState.up();
            case DOWN -> this.kinematicState.down();
        }
    }

    public void setGhostPosition(Vector2D ghostPosition){
        this.ghostPosition = ghostPosition;
    }


    public void setBlinkyPosition(Vector2D blinkyPosition) {
        this.blinkyPosition = blinkyPosition; 
    }

    public Vector2D getBlinkyPosition(){
        return this.blinkyPosition;
    }

    public Set<Direction> getPossibleDirections() {
        return this.possibleDirections;
    }

    public void setTargetLocation(Vector2D targetLocation) {
        this.targetLocation = targetLocation;
    }
    

    public Vector2D getTargetLocation() {
        return switch (this.ghostMode) {
            case CHASE -> this.playerPosition;
            case SCATTER -> this.targetCorner;
            case FRIGHTENED -> null;
        };
    }

    public Vector2D getPlayerPosition(){
        return this.playerPosition;
    }

    public Direction selectDirection(Set<Direction> possibleDirections) {
        if (possibleDirections.isEmpty()) {
            return currentDirection;
        }

        // If the ghost is in FRIGHTENED mode, skip distance calculations and choose randomly
        if (targetLocation == null || targetLocation.equals(new Vector2D(-1, -1))) {
            Direction[] directions = possibleDirections.toArray(new Direction[0]);
            return directions[new Random().nextInt(directions.length)];
        }
        // ghosts have to continue in a direction for a minimum time before changing direction
        if (currentDirection != null && currentDirectionCount < minimumDirectionCount) {
            currentDirectionCount++;
            return currentDirection;
        }

        Map<Direction, Double> distances = new HashMap<>();

        for (Direction direction : possibleDirections) {
            // ghosts never choose to reverse travel
            if (currentDirection == null || direction != currentDirection.opposite()) {
                distances.put(direction, Vector2D.calculateEuclideanDistance(this.kinematicState.getPotentialPosition(direction), this.targetLocation));
            }
        }

        // only go the opposite way if trapped
        if (distances.isEmpty()) {
            return currentDirection.opposite();
        }

        // select the direction that will reach the target location fastest
        return Collections.min(distances.entrySet(), Map.Entry.comparingByValue()).getKey();
    }

    @Override
    public void setGhostMode(GhostMode ghostMode) {
        this.ghostMode = ghostMode;
        this.kinematicState.setSpeed(speeds.get(ghostMode));

        if (ghostMode == GhostMode.FRIGHTENED) {
            enterFrightenedMode();
        } else {
            exitFrightenedMode();
        }



        // Ensure direction is switched for a new mode
        this.currentDirectionCount = minimumDirectionCount;
    }

     public void enterFrightenedMode() {
        this.currentStrategy = new GhostModeDecorator(baseStrategy);
        this.context.setState(edibleState);
    }


    public void exitFrightenedMode() {
        this.currentStrategy = baseStrategy;
        this.context.setState(normalState);
    }


    @Override
    public boolean collidesWith(Renderable renderable) {
        return boundingBox.collidesWith(kinematicState.getSpeed(), kinematicState.getDirection(), renderable.getBoundingBox());
    }

    @Override
    public void collideWith(Level level, Renderable renderable) {
        if (renderable instanceof Pacman) {
            // Check Pac-Man's invulnerability buffer
            if (!((LevelImpl) level).isPacmanInvulnerable()) {
                this.context.collideWithGhost((LevelImpl)level, this); // Trigger state-specific action
            }
        }
    }

    public void respawn(){
        this.setPosition(startingPosition); // Move ghost to starting position
        this.boundingBox.setTopLeft(startingPosition);
        this.kinematicState = new KinematicStateImpl.KinematicStateBuilder()
                .setPosition(startingPosition)
                .build();
        
        this.ghostMode = GhostMode.SCATTER; // Set to SCATTER mode after respawn
        this.isRespawning = true; // Mark as in respawn process
        this.respawnTickCounter = 0; // Start respawn delay timer
        this.context.setState(normalState); // Set back to normal state after frightened
    }
    @Override
    public void update(Vector2D playerPosition) {
        this.playerPosition = playerPosition;
    }


    @Override
    public Vector2D getPositionBeforeLastUpdate() {
        return this.kinematicState.getPreviousPosition();
    }

    @Override
    public double getHeight() {
        return this.boundingBox.getHeight();
    }

    @Override
    public double getWidth() {
        return this.boundingBox.getWidth();
    }

    @Override
    public Vector2D getPosition() {
        return this.kinematicState.getPosition();
    }

    @Override
    public void setPosition(Vector2D position) {
        this.kinematicState.setPosition(position);
    }

    @Override
    public Layer getLayer() {
        return this.layer;
    }

    @Override
    public BoundingBox getBoundingBox() {
        return this.boundingBox;
    }

    @Override
    public void reset() {
        // return ghost to starting position
        this.kinematicState = new KinematicStateImpl.KinematicStateBuilder()
                .setPosition(startingPosition)
                .build();
        this.boundingBox.setTopLeft(startingPosition);
        this.ghostMode = GhostMode.SCATTER;
        this.currentDirectionCount = minimumDirectionCount;
        this.exitFrightenedMode();
        
    }

    @Override
    public void setPossibleDirections(Set<Direction> possibleDirections) {
        this.possibleDirections = possibleDirections;
    }

    @Override
    public Direction getDirection() {
        return this.kinematicState.getDirection();
    }

    @Override
    public Vector2D getCenter() {
        return new Vector2D(boundingBox.getMiddleX(), boundingBox.getMiddleY());
    }


    @Override
    public GhostStrategy getGhostStrategy() {
        return this.currentStrategy;
    }


    public boolean isAtCorner() {
        // If there are more than 2 possible directions, the ghost is at an intersection or corner
        return possibleDirections.size() > 2;
    }
}
