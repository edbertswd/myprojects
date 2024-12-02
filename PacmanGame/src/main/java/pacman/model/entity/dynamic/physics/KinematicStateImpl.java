package pacman.model.entity.dynamic.physics;

/**
 * Discrete kinematic state implementation.
 */
public class KinematicStateImpl implements KinematicState {
    private Vector2D position;
    private Vector2D previousPosition;
    private double speed;
    private Vector2D velocity;
    private Direction direction;

    private KinematicStateImpl(
            Vector2D position,
            double speed,
            Direction direction
    ) {
        this.position = position;
        this.previousPosition = position;
        this.speed = speed;
        this.velocity = createVelocityVector(direction);
        this.direction = direction;
    }

    @Override
    public Vector2D getPosition() {
        return this.position;
    }

    @Override
    public void setPosition(Vector2D position) {
        this.position = position;
    }

    @Override
    public void update() {
        this.previousPosition = position;
        this.position = this.position.add(this.velocity);
    }

    private Vector2D createVelocityVector(Direction direction) {
        return switch (direction) {
            case LEFT -> new Vector2D(-speed, 0);
            case RIGHT -> new Vector2D(speed, 0);
            case UP -> new Vector2D(0, -speed);
            case DOWN -> new Vector2D(0, speed);
        };
    }

    @Override
    public Vector2D getPotentialPosition(Direction direction) {
        return this.position.add(createVelocityVector(direction));
    }

    @Override
    public Direction getDirection() {
        return this.direction;
    }

    @Override
    public void left() {
        this.direction = Direction.LEFT;
        this.velocity = createVelocityVector(Direction.LEFT);
    }

    @Override
    public void right() {
        this.direction = Direction.RIGHT;
        this.velocity = createVelocityVector(Direction.RIGHT);
    }

    @Override
    public void up() {
        this.direction = Direction.UP;
        this.velocity = createVelocityVector(Direction.UP);
    }

    @Override
    public void down() {
        this.direction = Direction.DOWN;
        this.velocity = createVelocityVector(Direction.DOWN);
    }

    @Override
    public double getSpeed() {
        return this.speed;
    }

    @Override
    public void setSpeed(double speed) {
        this.speed = speed;
        this.velocity = createVelocityVector(direction);
    }

    @Override
    public Vector2D getPreviousPosition() {
        return previousPosition;
    }

    public static class KinematicStateBuilder {
        private Vector2D position = Vector2D.ZERO;
        private double speed = 0;
        private Direction direction = Direction.LEFT;

        public KinematicStateBuilder setPosition(Vector2D position) {
            this.position = position;
            return this;
        }

        public KinematicStateBuilder setSpeed(double speed) {
            this.speed = speed;
            return this;
        }

        public KinematicStateBuilder setDirection(Direction direction) {
            this.direction = direction;
            return this;
        }

        public KinematicStateImpl build() {
            return new KinematicStateImpl(
                    this.position,
                    this.speed,
                    this.direction
            );
        }
    }
}
