from sklearn.dummy import DummyClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier


def get_baseline_dummy():
    return DummyClassifier(strategy='prior')

def get_logistic_regression():
    return LogisticRegression(class_weight='balanced', max_iter=1000, random_state=20260907)

def get_xgboost(scale_pos_weight=1.0):
    # Fallback to HistGradientBoostingClassifier since XGBoost is unavailable
    from sklearn.ensemble import HistGradientBoostingClassifier
    # We can't directly pass scale_pos_weight to HistGradientBoostingClassifier easily, 
    # but we can configure it if necessary or just rely on its native boosting tree learning.
    return HistGradientBoostingClassifier(
        max_iter=100,
        learning_rate=0.1,
        random_state=20260907
    )
