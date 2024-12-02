package pacman.model.entity.dynamic.physics;

/**
 * Standard implementation of an BoundingBox, with O(1) time
 * collidesWith and containsPoint implementations.
 */
public class BoundingBoxImpl implements BoundingBox {
    public static final int COLLISION_OFFSET = 4;
    private final double width;
    private final double height;
    private Vector2D topLeft;

    public BoundingBoxImpl(
            Vector2D topLeft,
            double height,
            double width) {
        this.width = width;
        this.height = height;
        this.topLeft = topLeft;
    }

    @Override
    public double getWidth() {
        return width;
    }

    @Override
    public double getHeight() {
        return height;
    }

    @Override
    public double getLeftX() {
        return topLeft.getX();
    }

    @Override
    public double getMiddleX() {
        return topLeft.getX() + width / 2;
    }

    @Override
    public double getRightX() {
        return topLeft.getX() + width;
    }

    @Override
    public double getTopY() {
        return topLeft.getY();
    }

    @Override
    public double getMiddleY() {
        return topLeft.getY() + height / 2;
    }

    @Override
    public double getBottomY() {
        return topLeft.getY() + height;
    }

    @Override
    public void setTopLeft(Vector2D topLeft) {
        this.topLeft = topLeft;
    }

    @Override
    public boolean collidesWith(double speed, Direction direction, BoundingBox box) {
        return switch (direction) {
            case LEFT -> box.containsPoint(new Vector2D(this.getLeftX() + COLLISION_OFFSET, this.getMiddleY()));
            case RIGHT -> box.containsPoint(new Vector2D(this.getRightX() - COLLISION_OFFSET, this.getMiddleY()));
            case UP -> box.containsPoint(new Vector2D(this.getMiddleX(), this.getTopY() + COLLISION_OFFSET));
            case DOWN -> box.containsPoint(new Vector2D(this.getMiddleX(), this.getBottomY() - COLLISION_OFFSET));
        };
    }

    @Override
    public boolean containsPoint(Vector2D point) {
        return point.isRightOf(getLeftX()) &&
                point.isLeftOf(getRightX()) &&
                point.isAbove(getBottomY()) &&
                point.isBelow(getTopY());
    }
}